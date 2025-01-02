// ARQPacketHandlerImpl.ts
import EventEmitter from 'eventemitter3';

interface ARQPacketHandlerEvents {
    ackCompleted: { index: number };
    ackTimeout: { index: number };
}

export interface ARQPacketHandler {
    handlePacket(data: Uint8Array): void;
    isWaitingForAck(): boolean;
    reset(): void;
    sendPacket(data: Uint8Array, resend?: boolean, checkWaiting?: boolean): [boolean, number];
    setDataHandler(handler: (index: number, data: Uint8Array) => [boolean, Uint8Array]): void;
    setAckHandler(handler: (index: number, data: Uint8Array) => boolean): void;
    eventEmitter: EventEmitter<ARQPacketHandlerEvents>;
}


export class ARQPacketHandlerImpl implements ARQPacketHandler {
    private packetSender: (data: Uint8Array) => void;
    private waitingForAck: boolean = false;
    private index: number = 0;
    private lastReceivedIndex: number = 0xFF; // 初期値は無効なインデックス
    private resendInterval: number;
    private resendAttempts: number;
    private dataHandler: ((index: number, data: Uint8Array) => [boolean, Uint8Array]) | null = null;
    private ackHandler: ((index: number, data: Uint8Array) => boolean) | null = null;
    private sentData: Uint8Array = new Uint8Array();
    private lastAckPacket: Uint8Array = new Uint8Array();
    eventEmitter = new EventEmitter<ARQPacketHandlerEvents>();
    private timerId: NodeJS.Timeout | null = null;
    private resendCount: number = 0;

    constructor(
        packetSender: (data: Uint8Array) => void,
        resendInterval: number = 100,
        resendAttempts: number = 10,
    ) {
        this.packetSender = packetSender;
        this.resendInterval = resendInterval;
        this.resendAttempts = resendAttempts;
    }
    private createResendTimer(): void {
        this.resendCount = 0;
        this.timerId = setTimeout(() => {
            this.resendTimerCallback();
        }, this.resendInterval);
    }
    private resendTimerCallback(): void {
        this.resendCount++;
        if (this.resendCount >= this.resendAttempts) {
            const oldIndex = this.index;
            this.waitingForAck = false;
            this.incrementIndex();
            if (this.ackHandler) {
                this.ackHandler(oldIndex, new Uint8Array());
            }
            console.error("resend_timer_ : timeout");
            this.eventEmitter.emit('ackTimeout', { index: oldIndex });
            this.timerId = null;
            return;
        }
        console.debug("resend_timer_ : resending...");
        this.sendPacket(this.sentData, true);
        this.timerId = setTimeout(() => {
            this.resendTimerCallback()
        }, this.resendInterval)
    }
    reset(): void {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        this.waitingForAck = false;
        this.lastReceivedIndex = 0xFF;
        this.incrementIndex();
    }
    sendPacket(data: Uint8Array, resend: boolean = false, checkWaiting: boolean = true): [boolean, number] {
        if (checkWaiting && this.waitingForAck && !resend) {
            // waiting for ack, reject sending request.
            console.debug("sendPacket() : sending rejected.");
            return [false, this.index];
        }
        if (!resend) {
            this.waitingForAck = true;
            this.sentData = data.slice(); // コピーを作成
        }
        const packet = new Uint8Array(1 + data.length)
        packet[0] = this.index;
        packet.set(data, 1);
        this.packetSender(packet);

        if (resend) return [true, this.index];
        this.createResendTimer();
        console.debug("timer started");
        return [true, this.index];
    }
    setDataHandler(handler: (index: number, data: Uint8Array) => [boolean, Uint8Array]): void {
        this.dataHandler = handler;
    }
    setAckHandler(handler: (index: number, data: Uint8Array) => boolean): void {
        this.ackHandler = handler;
    }
    private incrementIndex(): void {
        this.index = (this.index + 1) & 0x7F;  // 7ビットの範囲内でインクリメント
    }
    private handleData(index: number, data: Uint8Array): void {
        console.debug(">> handleData()");
        if (index === this.lastReceivedIndex) {
            console.warn("handleData() : already received, ignored.");
            // 重複パケットの場合、最後に送信したACKを再送信
            this.packetSender(this.lastAckPacket);
            return;
        }
        this.lastReceivedIndex = index;
        console.debug("handleData() : receive data");
        if (this.dataHandler) {
            const [isSuccess, responseData] = this.dataHandler(index, data);
            if (isSuccess) {
                this.sendAck(index, responseData);
            }
        }
    }
    private handleAck(index: number, data: Uint8Array): void {
        let ackCompleted = true;
        console.debug(">> handleAck()");
        if (index !== this.index) {
            console.warn(
                "handleAck() : received invalid ack index! ignored."
            );
            return;
        }
        if (!this.waitingForAck) {
            console.warn(
                "handleAck() : received ack but not waiting for!"
            );
            return;
        }
        if (this.ackHandler) {
            ackCompleted = this.ackHandler(index, data);
            console.debug(
                `handleAck() : ack completed? ${ackCompleted}`
            );
        }
        if (ackCompleted) {
            this.waitingForAck = false;
            if (this.timerId) {
                clearTimeout(this.timerId);
                this.timerId = null;
                console.debug("handleAck() : stop resend timer");
            }
            this.incrementIndex();
        }
        if (ackCompleted) {
            this.eventEmitter.emit('ackCompleted', { index });
        }
    }
    private sendAck(index: number, data: Uint8Array): void {
        this.lastAckPacket = new Uint8Array(1 + data.length);
        this.lastAckPacket[0] = (0x80 | index); // set ACK bit
        this.lastAckPacket.set(data, 1);
        this.packetSender(this.lastAckPacket);
    }
    handlePacket(data: Uint8Array): void {
        if (data.length < 1) {
            return;
        }
        const header = data[0];
        const isAck = (header & 0x80) !== 0;
        const index = header & 0x7F;
        if (isAck) {
            this.handleAck(index, data.slice(1));
        } else {
            this.handleData(index, data.slice(1));
        }
        return;
    }
    isWaitingForAck(): boolean {
        return this.waitingForAck;
    }
}