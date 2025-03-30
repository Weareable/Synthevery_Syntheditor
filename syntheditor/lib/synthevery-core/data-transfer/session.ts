// data-transfer/session.ts
import { RequestData, ResponseData, RejectData, NextData, CancelData, ChunkData, CommandAck, DataType } from '../types/data-transfer';
import { SessionID, CommandType, SessionStatusType, SessionStatus } from './constants';
import { SenderDataStoreInterface, ReceiverDataStoreInterface, SenderSessionInterface, ReceiverSessionInterface } from './interfaces'; // 修正
import EventEmitter from 'eventemitter3';

const kChunkSize = 192;

export class SenderSession implements SenderSessionInterface { // implements を修正
    private store: SenderDataStoreInterface;
    private position: number;
    private status: SessionStatusType;
    private lastAliveCheckTime: number;
    private eventEmitter: EventEmitter;

    constructor(store: SenderDataStoreInterface) {
        this.store = store;
        this.position = 0;
        this.status = SessionStatus.kStatusPending;
        this.lastAliveCheckTime = Date.now();
        this.eventEmitter = new EventEmitter();
    }
    getEventEmitter(): EventEmitter {
        return this.eventEmitter;
    }

    getChunk(): ChunkData {
        const start = Math.min(this.position, this.store.size());
        const end = Math.min(start + kChunkSize, this.store.size());
        const size = end - start;
        return { position: this.position, data: this.store.get(start, size) };
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
            chainNodes: [] // 今回は空
        };
    }
    onResponse(data: ResponseData): void {
        if (data.isAccepted) {
            this.status = SessionStatus.kStatusTransferring;
            this.lastAliveCheckTime = Date.now();
        } else {
            this.status = SessionStatus.kStatusRejected;
        }
        this.eventEmitter.emit('statusChanged', this.status);
    }
    onReject(data: RejectData): void {
        this.status = SessionStatus.kStatusRejected;
        this.eventEmitter.emit('statusChanged', this.status);
    }
    onNext(data: NextData): void {
        if (data.position > this.position + kChunkSize) {
            this.status = SessionStatus.kStatusInvalidPosition;
        } else {
            this.position = Math.min(
                Math.max(this.position + kChunkSize, data.position),
                this.store.size()
            );
            this.lastAliveCheckTime = Date.now();
        }
        this.eventEmitter.emit('positionChanged', this.position); // positionの変化を通知
        this.eventEmitter.emit('statusChanged', this.status);
    }

    onComplete(): void {
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

}

export class ReceiverSession implements ReceiverSessionInterface { // implements を修正
    private store: ReceiverDataStoreInterface;
    private position: number;
    private status: SessionStatusType;
    private lastAliveCheckTime: number;
    private eventEmitter: EventEmitter;

    constructor(store: ReceiverDataStoreInterface) {
        if (!store) {
            throw new Error("Receiver store cannot be null.");
        }
        this.store = store;
        this.position = 0;
        this.status = SessionStatus.kStatusPending;
        this.lastAliveCheckTime = Date.now();
        this.eventEmitter = new EventEmitter();
    }

    getEventEmitter(): EventEmitter {
        return this.eventEmitter;
    }

    onChunk(data: ChunkData): void {
        if (!this.store) {
            console.error("this.store is null");
            return;
        }

        if (data.position > this.position + kChunkSize) {
            this.status = SessionStatus.kStatusInvalidPosition;
        } else {
            this.store.write(data.data, data.position);
            this.position = Math.max(
                Math.min(this.position + kChunkSize, this.store.size()), data.position
            );
        }

        if (this.position === this.store.size()) {
            this.status = SessionStatus.kStatusCompleted;
        }
        this.eventEmitter.emit('positionChanged', this.position); // positionの変化を通知
        this.eventEmitter.emit('statusChanged', this.status);
    }

    getNext(): NextData {
        return { position: this.position };
    }
    getPosition(): number {
        return this.position;
    }
    getStatus(): SessionStatusType {
        return this.status;
    }

    onRequest(data: RequestData): void {
        this.status = SessionStatus.kStatusTransferring;
        this.eventEmitter.emit('statusChanged', this.status);
    }

    getResponse(): ResponseData {
        return { isAccepted: true, reason: 0 }; // 仮
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
}