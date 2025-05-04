// data-transfer/session.ts
import { RequestData, ResponseData, RejectData, NextData, CancelData, ChunkData, CommandAck, DataType, ResultData, serializeChunkData, serializeCRCPacket, deserializeCRCPacket, deserializeChunkData } from '../types/data-transfer';
import { SessionID, CommandType, SessionStatusType, SessionStatus } from './constants';
import { SenderDataStoreInterface, ReceiverDataStoreInterface, SenderSessionInterface, ReceiverSessionInterface } from './interfaces'; // 修正
import EventEmitter from 'eventemitter3';
import { SRArqSenderSession, SRArqReceiverSession } from '../connection/srarq/session';
import { P2PMacAddress } from '../types/mesh';
const kChunkSize = 192;

export class SenderSession implements SenderSessionInterface { // implements を修正
    private store: SenderDataStoreInterface;
    private position: number;
    private status: SessionStatusType;
    private lastAliveCheckTime: number;
    private eventEmitter: EventEmitter;
    private senderSession: SRArqSenderSession;
    private chainNodes: P2PMacAddress[];
    constructor(store: SenderDataStoreInterface, senderSession: SRArqSenderSession, chainNodes: P2PMacAddress[]) {
        this.store = store;
        this.position = 0;
        this.status = SessionStatus.kStatusPending;
        this.lastAliveCheckTime = Date.now();
        this.eventEmitter = new EventEmitter();
        this.senderSession = senderSession;
        this.chainNodes = chainNodes;

        this.senderSession.sender.eventEmitter.on("windowAvailable", () => {
            this.sendData();
        });
    }
    getEventEmitter(): EventEmitter {
        return this.eventEmitter;
    }
    setPosition(offset: number): void {
        this.position = offset;
    }
    getPosition(): number {
        return this.position;
    }
    getStatus(): SessionStatusType {
        return this.status;
    }
    getRequest(): RequestData {
        return {
            type: this.store.type(),
            metadata: this.store.metadata(),
            totalSize: this.store.size(),
            chainNodes: this.chainNodes
        };
    }
    onResponse(data: ResponseData): void {
        if (data.isAccepted) {
            this.status = SessionStatus.kStatusTransferring;
            this.lastAliveCheckTime = Date.now();
            // 初回データ送信
            this.sendData();
        } else {
            this.status = SessionStatus.kStatusRejected;
        }
        this.eventEmitter.emit('statusChanged', this.status);
    }
    onReject(data: RejectData): void {
        this.status = SessionStatus.kStatusRejected;
        this.eventEmitter.emit('statusChanged', this.status);
    }
    onResult(data: ResultData): void {
        this.status = SessionStatus.kStatusCompleted;
        this.eventEmitter.emit('statusChanged', this.status);
        this.eventEmitter.emit('completed');
    }
    alive(): boolean {
        const now = Date.now();
        if (this.status === SessionStatus.kStatusTransferring) {
            return true;
        }
        if (this.status === SessionStatus.kStatusPending && now - this.lastAliveCheckTime > 10000) {
            return false;
        }
        if (now - this.lastAliveCheckTime > 5000) {
            return false;
        }
        return true;
    }
    private sendData(): void {
        this.lastAliveCheckTime = Date.now();

        while (true) {
            if (this.position >= this.store.size()) {
                // データがなければ終了
                return;
            }

            const chunkSize = Math.min(kChunkSize, this.store.size() - this.position);
            const data = this.store.get(this.position, chunkSize);

            const packet = serializeCRCPacket({
                data: data,
                position: this.position,
            }, serializeChunkData);

            const result = this.senderSession.sender.send(packet);
            if (result === null) {
                // キューが一杯
                return;
            }

            this.position = Math.min(this.position + chunkSize, this.store.size());
        }
    }
}

export class ReceiverSession implements ReceiverSessionInterface { // implements を修正
    private store: ReceiverDataStoreInterface;
    private position: number;
    private status: SessionStatusType;
    private lastAliveCheckTime: number;
    private eventEmitter: EventEmitter;
    private request: RequestData;
    private receiverSession: SRArqReceiverSession;

    constructor(store: ReceiverDataStoreInterface, request: RequestData, receiverSession: SRArqReceiverSession) {
        if (!store) {
            throw new Error("Receiver store cannot be null.");
        }
        this.store = store;
        this.position = 0;
        this.status = SessionStatus.kStatusPending;
        this.lastAliveCheckTime = Date.now();
        this.eventEmitter = new EventEmitter();
        this.request = request;
        this.receiverSession = receiverSession;

        this.receiverSession.receiver.eventEmitter.on("received", (sequenceNumber: number) => {
            this.validateData(sequenceNumber);
        });

        this.receiverSession.receiver.eventEmitter.on("dataOrdered", (sequenceNumber: number, data: Uint8Array) => {
            this.writeData(sequenceNumber, data);
        });
    }

    getEventEmitter(): EventEmitter {
        return this.eventEmitter;
    }
    getPosition(): number {
        return this.position;
    }
    getStatus(): SessionStatusType {
        return this.status;
    }
    getRequest(): RequestData {
        return this.request;
    }


    onRequest(data: RequestData): void {
        this.status = SessionStatus.kStatusTransferring;
        this.eventEmitter.emit('statusChanged', this.status);
    }

    getResponse(): ResponseData {
        return { isAccepted: true, reason: 0 }; // 仮
    }

    getResult(): ResultData {
        return { result: this.status };
    }

    onCancel(data: CancelData): void {
        this.status = SessionStatus.kStatusCanceled;
        this.eventEmitter.emit('statusChanged', this.status);
    }
    alive(): boolean {
        const now = Date.now();
        if (this.status === SessionStatus.kStatusTransferring) {
            return true;
        }
        if (this.status === SessionStatus.kStatusPending && now - this.lastAliveCheckTime > 10000) {
            return false;
        }
        if (now - this.lastAliveCheckTime > 5000) {
            return false;
        }
        return true;
    }

    private validateData(sequenceNumber: number): void {
        const receivedData = this.receiverSession.receiver.getReceivedData(sequenceNumber);
        if (receivedData === null) {
            // データがない
            return;
        }

        const packet = deserializeCRCPacket(receivedData, deserializeChunkData);
        if (packet === null) {
            // パケットが壊れている
            return;
        }

        this.lastAliveCheckTime = Date.now();

        this.eventEmitter.emit('dataReceived', packet.data);

        this.receiverSession.receiver.sendAck(sequenceNumber, true);
    }

    private writeData(sequenceNumber: number, data: Uint8Array): void {
        const packet = deserializeCRCPacket(data, deserializeChunkData);
        if (packet === null) {
            // パケットが壊れている
            return;
        }

        this.store.write(packet.data.data, packet.data.position);
        this.position = Math.min(this.position + packet.data.data.length, this.store.size());

        if (this.position >= this.store.size()) {
            this.status = SessionStatus.kStatusCompleted;
            this.eventEmitter.emit("statusChanged", this.status);
        }

        this.eventEmitter.emit("completed");
    }
}