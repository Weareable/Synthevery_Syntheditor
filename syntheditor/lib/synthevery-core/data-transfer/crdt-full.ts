import { ReceiverPortInterface, ReceiverDataStoreInterface, ReceiverSessionInterface, SenderDataStoreInterface } from './interfaces';
import { P2PMacAddress } from '../types/mesh';
import { DataType, RequestData, ResponseData } from '../types/data-transfer';
import { packNotes } from '../../crdt/msgpack';
import { CRDTNote } from '../../crdt/types';
import { DataTypes, SessionID } from './constants';
import { DataTransferController } from './data-transfer-controller';

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
    private getFullState?: () => CRDTNote[]; // 返信用（任意）
    private stores: Map<number, CRDTFullStateReceiverStore> = new Map();
    private senders: Map<number, P2PMacAddress> = new Map();
    private metadataBySession: Map<number, string> = new Map();
    private dt?: DataTransferController;
    constructor(onReceiveFull: (peer: P2PMacAddress, notes: CRDTNote[]) => void, getFullState?: () => CRDTNote[], dt?: DataTransferController) {
        this.onReceiveFull = onReceiveFull;
        this.getFullState = getFullState;
        this.dt = dt;
    }

    getDataType(): DataType { return DataTypes.kCRDTFullState; }

    handleRequest(sender: P2PMacAddress, sessionId: SessionID, data: RequestData): { receiver: ReceiverDataStoreInterface; responseData: ResponseData; } {
        console.log('[CRDT][recv][full-state][dt] begin', { from: sender, total: data.totalSize });
        const store = new CRDTFullStateReceiverStore(data.totalSize);
        this.stores.set(sessionId, store);
        this.senders.set(sessionId, sender);
        this.metadataBySession.set(sessionId, data.metadata);
        return { receiver: store, responseData: { isAccepted: true, reason: 0 } };
    }

    onStart(_session: ReceiverSessionInterface, _id: SessionID): void { }

    onFinish(session: ReceiverSessionInterface, id: SessionID): void {
        const store = this.stores.get(id);
        if (!store) return;
        try {
            const bin = store.getBuffer();
            // デバイス形式: track毎に [adds[], removes[]]
            const { decode } = require('@msgpack/msgpack');
            const root = decode(bin) as any[]; // [ [adds, removes], ... ]
            const sender = this.senders.get(id) ?? { address: new Uint8Array() };
            // マルチトラック配列へ変換
            const tracksPayload: { track: number; adds: CRDTNote[]; removes: any[] }[] = [];
            const { Dto } = require('../../crdt/dto');
            for (let ti = 0; ti < root.length; ti++) {
                const trackTuple = root[ti];
                if (!Array.isArray(trackTuple) || trackTuple.length < 2) continue;
                const addsArr = trackTuple[0] as any[];
                const removesArr = trackTuple[1] as any[];
                const adds: CRDTNote[] = [];
                for (const m of addsArr) {
                    let n: CRDTNote;
                    if (Array.isArray(m)) {
                        // 判別: デバイス形式([id, noteHash, tick, noteType, payload]) or Web形式([type, pos, id, payload])
                        const head = m[0];
                        if (typeof head === 'number' && (head === 0 || head === 1)) {
                            n = Dto.noteFromArray(m);
                        } else {
                            n = Dto.deviceNoteFromArray(m);
                        }
                    } else {
                        n = Dto.toCRDTNote(m);
                    }
                    adds.push(n);
                }
                tracksPayload.push({ track: ti, adds, removes: removesArr });
            }
            // CRDTSyncManagerのmultiハンドラでのみ処理
            try {
                const { syntheveryServiceContainer } = require('../service-container');
                const services = syntheveryServiceContainer?.getServices?.();
                if (services?.crdtSyncManager && (services.crdtSyncManager as any).handlerOnReceiveFullMulti) {
                    const fullTracks = tracksPayload.map(t => ({
                        track: t.track,
                        adds: t.adds,
                        removes: t.removes.map((rid: any) => Array.isArray(rid)
                            ? { mac: { address: new Uint8Array(rid[0]) }, timestamp: (rid[1] >>> 0) }
                            : Dto.toNoteID(rid))
                    }));
                    (services.crdtSyncManager as any).handlerOnReceiveFullMulti(sender, fullTracks);
                } else {
                    console.warn('[CRDT][recv][full-state] missing handlerOnReceiveFullMulti; ignoring payload');
                }
            } catch { }

            // 返信: 受信完了後にこちらのフル状態を DataTransfer で送り返す（双方向合流）
            const meta = this.metadataBySession.get(id) || '';
            // 返信: マルチトラックで[adds[], removes[]]を構築
            if (this.dt && meta !== 'crdt_full_reply') {
                const { encode } = require('@msgpack/msgpack');
                const { syntheveryServiceContainer } = require('../service-container');
                const services = syntheveryServiceContainer?.getServices?.();
                let packed: Uint8Array | null = null;
                try {
                    if (services?.crdtSyncManager && (services.crdtSyncManager as any).handlerGetFullStateMulti) {
                        const multi = (services.crdtSyncManager as any).handlerGetFullStateMulti();
                        const { Dto } = require('../../crdt/dto');
                        const tracksArr = multi.map((t: { adds: CRDTNote[]; removes: any[] }) => {
                            // デバイス互換: CRDTNoteMsg配列形式 [id, noteHash, tick, noteType, payload]
                            const adds = t.adds.map((n: CRDTNote) => {
                                const id = [n.id.mac.address, n.id.timestamp >>> 0];
                                const noteHash = 0 >>> 0; // 未使用のため0
                                const tick = n.pos.tick >>> 0;
                                const noteType = (n.type === 0 ? 0 : 1) >>> 0;
                                const payload = n.type === 0
                                    ? [(n.payload as any).channel, (n.payload as any).note_num, (n.payload as any).velocity]
                                    : [(n.payload as any).channel, (n.payload as any).effect_id, (n.payload as any).value];
                                return [id, noteHash, tick, noteType, payload];
                            });
                            const removes = t.removes.map((id: any) => [id.mac.address, id.timestamp >>> 0]);
                            return [adds, removes];
                        });
                        packed = encode(tracksArr);
                    }
                } catch (e) {
                    console.warn('[CRDT][full-state][reply][pack][warn]', e);
                }
                if (packed) {
                    class CRDTFullStateSenderStore implements SenderDataStoreInterface {
                        private bytes: Uint8Array; private meta: string;
                        constructor(bytes: Uint8Array, meta: string) { this.bytes = bytes; this.meta = meta; }
                        size(): number { return this.bytes.length; }
                        type(): DataType { return DataTypes.kCRDTFullState; }
                        get(offset: number, size: number): Uint8Array { return this.bytes.slice(offset, offset + size); }
                        metadata(): string { return this.meta; }
                    }
                    try {
                        this.dt.sendRequest(sender, new CRDTFullStateSenderStore(packed, 'crdt_full_reply'), []);
                    } catch (e) {
                        console.warn('[CRDT][full-state][reply][dt][warn]', e);
                    }
                }
            }
        } catch (e) {
            console.warn('[CRDT][recv][full-state][dt][error]', e);
        } finally {
            this.stores.delete(id);
            this.senders.delete(id);
            this.metadataBySession.delete(id);
        }
    }
}
