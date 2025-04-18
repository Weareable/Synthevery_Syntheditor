import { EventEmitter } from 'eventemitter3';

export interface SequenceNumberOperations {
    increment(sequenceNumber: number, increment: number): number;
    decrement(sequenceNumber: number, decrement: number): number;
    isNewer(sequenceNumber: number, otherSequenceNumber: number): boolean;
    isInRange(sequenceNumber: number, start: number, end: number): boolean;
    difference(sequenceNumber: number, otherSequenceNumber: number): number;
}

export interface TimeoutStrategy {
    getTimeout(sequenceNumber: number): number;
}

export function getFixedTimeoutStrategy(timeout: number): TimeoutStrategy {
    return {
        getTimeout: () => timeout,
    }
}

export interface PacketTransmitter {
    transmitData(sequenceNumber: number, data: Uint8Array): Promise<void>;
    transmitAck(sequenceNumber: number): Promise<void>;
    transmitNack(sequenceNumber: number): Promise<void>;
}

export interface SendPacket {
    packetStatus: 'sent' | 'acked' | 'nacked' | 'timeout';
    data: Uint8Array;
    timer: NodeJS.Timeout;
}

interface SRArqSenderEvents {
    timeout: (sequenceNumber: number) => void;
    acked: (sequenceNumber: number, isAcked: boolean) => void;
    windowAvailable: () => void;
}

export class SRArqSender {
    private slidingWindowStart: number = 0;
    public readonly eventEmitter = new EventEmitter<SRArqSenderEvents>();

    constructor(
        private readonly packetMap: Map<number, SendPacket>,
        private readonly sequenceNumberOperations: SequenceNumberOperations,
        private readonly timeoutStrategy: TimeoutStrategy,
        private readonly packetTransmitter: PacketTransmitter,
        private readonly slidingWindowLength: number,
    ) { }

    send(data: Uint8Array): number | null {
        const sequenceNumber = this.searchAvailableSequenceNumber();
        if (sequenceNumber === null) {
            return null;
        }
        this.sendPacket(sequenceNumber, data);
        return sequenceNumber;
    }

    receiveAck(sequenceNumber: number, isAcked: boolean): void {
        const packet = this.packetMap.get(sequenceNumber);
        if (packet === undefined) {
            // 無効なシーケンス番号
            return;
        }

        clearTimeout(packet.timer);

        if (isAcked) {
            packet.packetStatus = 'acked';
            this.eventEmitter.emit('acked', sequenceNumber, true);
            this.slideWindow();
        } else {
            packet.packetStatus = 'nacked';
            this.eventEmitter.emit('acked', sequenceNumber, false);
            this.sendPacket(sequenceNumber, packet.data);
        }

        if (isAcked) {
            this.eventEmitter.emit('windowAvailable');
        }
    }

    private searchAvailableSequenceNumber(): number | null {
        const end = this.sequenceNumberOperations.increment(this.slidingWindowStart, this.slidingWindowLength);
        for (let i = this.slidingWindowStart; this.sequenceNumberOperations.isInRange(i, this.slidingWindowStart, end); i = this.sequenceNumberOperations.increment(i, 1)) {
            if (!this.packetMap.has(i)) {
                return i;
            }
        }
        return null;
    }

    private sendPacket(sequenceNumber: number, data: Uint8Array): void {
        const timer = setTimeout(() => {
            this.onSendTimeout(sequenceNumber);
        }, this.timeoutStrategy.getTimeout(sequenceNumber));

        const packet = this.packetMap.get(sequenceNumber);
        if (packet !== undefined) {
            clearTimeout(packet.timer);
        }

        this.packetMap.set(sequenceNumber, {
            packetStatus: 'sent',
            data,
            timer,
        });

        this.packetTransmitter.transmitData(sequenceNumber, data);
    }

    private onSendTimeout(sequenceNumber: number): void {
        const packet = this.packetMap.get(sequenceNumber);
        if (packet === undefined) {
            // 無効なシーケンス番号
            return;
        }

        packet.packetStatus = 'timeout';
        clearTimeout(packet.timer);

        this.eventEmitter.emit('timeout', sequenceNumber);

        this.sendPacket(sequenceNumber, packet.data);
    }

    private slideWindow(): void {
        const initialSlidingWindowStart = this.slidingWindowStart;
        const end = this.sequenceNumberOperations.increment(this.slidingWindowStart, this.slidingWindowLength);
        while (this.sequenceNumberOperations.isInRange(this.slidingWindowStart, initialSlidingWindowStart, end)) {
            // Ackedなら次に進める
            const packet = this.packetMap.get(this.slidingWindowStart);
            if (packet !== undefined && packet.packetStatus === 'acked') {
                this.slidingWindowStart = this.sequenceNumberOperations.increment(this.slidingWindowStart, 1);
                continue;
            }

            // Ackでないパケットがある場合はスライドを停止
            break;
        }

        // スライディングウィンドウから外れたパケットを破棄
        for (let i = initialSlidingWindowStart; this.sequenceNumberOperations.isInRange(i, initialSlidingWindowStart, this.slidingWindowStart); i++) {
            this.packetMap.delete(i);
        }
    }
}

export interface MissingPacketHandler {
    onMissingPackets(missingPackets: number[]): void;
}

export function getImmediateMissingPacketHandler(
    packetTransmitter: PacketTransmitter,
): MissingPacketHandler {
    return {
        onMissingPackets: (missingPackets: number[]) => {
            for (const sequenceNumber of missingPackets) {
                packetTransmitter.transmitNack(sequenceNumber);
            }
        }
    }
}

export interface ReceivePacket {
    packetStatus: 'received' | 'acked' | 'nacked';
    data: Uint8Array;
}

export interface SRArqReceiverEvents {
    received: (sequenceNumber: number) => void;
}

export class SRArqReceiver {
    private slidingWindowStart: number = 0;
    public readonly eventEmitter = new EventEmitter<SRArqReceiverEvents>();

    constructor(
        private readonly packetMap: Map<number, ReceivePacket>,
        private readonly sequenceNumberOperations: SequenceNumberOperations,
        private readonly slidingWindowLength: number,
        private readonly packetTransmitter: PacketTransmitter,
        private readonly missingPacketHandler: MissingPacketHandler,
    ) { }

    receivePacket(sequenceNumber: number, data: Uint8Array): void {
        // スライディングウィンドウ外のパケットはAckedとして処理
        if (!this.sequenceNumberOperations.isInRange(sequenceNumber, this.slidingWindowStart, this.sequenceNumberOperations.increment(this.slidingWindowStart, this.slidingWindowLength))) {
            // Ack再送
            this.packetTransmitter.transmitAck(sequenceNumber);
            return;
        }

        const packet = this.packetMap.get(sequenceNumber);

        // パケットがすでに受信済み
        if (packet !== undefined) {
            // Acked -> Ack再送
            if (packet.packetStatus === 'acked') {
                this.packetTransmitter.transmitAck(sequenceNumber);
                return;
            }

            // Nacked or Received -> 過去に受信したが再送された
            // データを更新して再び通知
        }

        this.packetMap.set(sequenceNumber, {
            packetStatus: 'received',
            data,
        });

        this.eventEmitter.emit('received', sequenceNumber);

    }

    sendAck(sequenceNumber: number, isAcked: boolean): void {
        const packet = this.packetMap.get(sequenceNumber);
        if (packet === undefined) {
            // 無効なシーケンス番号
            return;
        }

        if (isAcked) {
            packet.packetStatus = 'acked';
            this.slideWindow();
            this.packetTransmitter.transmitAck(sequenceNumber);
        } else {
            packet.packetStatus = 'nacked';
            this.packetTransmitter.transmitNack(sequenceNumber);
        }

        // sequenceNumberがスライディングウィンドウの範囲外なら抜ける
        if (!this.sequenceNumberOperations.isInRange(sequenceNumber, this.slidingWindowStart, this.sequenceNumberOperations.increment(this.slidingWindowStart, this.slidingWindowLength))) {
            return;
        }

        let outOfOrderPackets: number[] = [];

        // スライディングウィンドウの順序チェック
        for (let i = this.slidingWindowStart; this.sequenceNumberOperations.isInRange(i, this.slidingWindowStart, sequenceNumber); i = this.sequenceNumberOperations.increment(i, 1)) {
            if (!this.packetMap.has(i)) {
                outOfOrderPackets.push(i);
            }
        }

        if (outOfOrderPackets.length > 0) {
            this.missingPacketHandler.onMissingPackets(outOfOrderPackets);
        }
    }

    getReceivedData(sequenceNumber: number): Uint8Array | null {
        const packet = this.packetMap.get(sequenceNumber);
        if (packet === undefined) {
            // 無効なシーケンス番号
            return null;
        }
        return packet.data;
    }

    private slideWindow(): void {
        const initialSlidingWindowStart = this.slidingWindowStart;
        const end = this.sequenceNumberOperations.increment(this.slidingWindowStart, this.slidingWindowLength);
        while (this.sequenceNumberOperations.isInRange(this.slidingWindowStart, initialSlidingWindowStart, end)) {
            // Ackedなら次に進める
            const packet = this.packetMap.get(this.slidingWindowStart);
            if (packet !== undefined && packet.packetStatus === 'acked') {
                this.slidingWindowStart = this.sequenceNumberOperations.increment(this.slidingWindowStart, 1);
                continue;
            }

            // Ackでないパケットがある場合はスライドを停止
            break;
        }

        // スライディングウィンドウから外れたパケットを破棄
        for (let i = initialSlidingWindowStart; this.sequenceNumberOperations.isInRange(i, initialSlidingWindowStart, this.slidingWindowStart); i = this.sequenceNumberOperations.increment(i, 1)) {
            this.packetMap.delete(i);
        }
    }
}



