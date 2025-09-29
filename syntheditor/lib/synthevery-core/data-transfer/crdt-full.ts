import { ReceiverPortInterface, ReceiverDataStoreInterface, ReceiverSessionInterface } from './interfaces';
import { P2PMacAddress } from '../types/mesh';
import { DataType, RequestData, ResponseData } from '../types/data-transfer';
import { unpackNotes } from '../../crdt/msgpack';
import { CRDTNote } from '../../crdt/types';
import { DataTypes, SessionID } from './constants';

class CRDTFullStateReceiverStore implements ReceiverDataStoreInterface {
    private buffer: Uint8Array;
    constructor(totalSize: number) {
        this.buffer = new Uint8Array(totalSize);
    }
    write(data: Uint8Array, offset: number): void {
        this.buffer.set(data, offset);
    }
    size(): number { return this.buffer.length; }
    getBuffer(): Uint8Array { return this.buffer; }
}

export class CRDTFullStateReceiverPort implements ReceiverPortInterface {
    private onReceiveFull: (peer: P2PMacAddress, notes: CRDTNote[]) => void;
    private stores: Map<number, CRDTFullStateReceiverStore> = new Map();
    constructor(onReceiveFull: (peer: P2PMacAddress, notes: CRDTNote[]) => void) {
        this.onReceiveFull = onReceiveFull;
    }

    getDataType(): DataType { return DataTypes.kCRDTFullState; }

    handleRequest(sender: P2PMacAddress, sessionId: SessionID, data: RequestData): { receiver: ReceiverDataStoreInterface; responseData: ResponseData; } {
        console.log('[CRDT][recv][full-state][dt] begin', { from: sender, total: data.totalSize });
        const store = new CRDTFullStateReceiverStore(data.totalSize);
        this.stores.set(sessionId, store);
        return { receiver: store, responseData: { isAccepted: true, reason: 0 } };
    }

    onStart(_session: ReceiverSessionInterface, _id: SessionID): void { }

    onFinish(session: ReceiverSessionInterface, id: SessionID): void {
        const store = this.stores.get(id);
        if (!store) return;
        try {
            const bin = store.getBuffer();
            const notes = unpackNotes(bin);
            // sender 情報は ReceiverSessionInterface から直接取得不可のため、コールバック側で適宜解決
            this.onReceiveFull({ address: new Uint8Array() }, notes);
        } catch (e) {
            console.warn('[CRDT][recv][full-state][dt][error]', e);
        } finally {
            this.stores.delete(id);
        }
    }
}
