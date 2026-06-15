import { PayloadCommandClient } from './payload-command-client';
import { CommandID } from '../types/command';
import { COMMAND_CLIENT_ID_CRDT_SEQUENCE } from './constants';
import { P2PMacAddress } from '../types/mesh';
import { CRDTNote, NoteID } from '../../crdt/types';
import { CRDTDeltaMsg, Dto } from '../../crdt/dto';
import { encodeDelta, decodeDelta } from '../../crdt/msgpack';

export type OnDeltaAdd = (peer: P2PMacAddress, track: number, note: CRDTNote) => void;
export type OnDeltaRemove = (peer: P2PMacAddress, track: number, id: NoteID) => void;

export class CRDTSequenceClient extends PayloadCommandClient {
    private peer: P2PMacAddress;
    private onAdd: OnDeltaAdd;
    private onRemove: OnDeltaRemove;

    constructor(peer: P2PMacAddress, onAdd: OnDeltaAdd, onRemove: OnDeltaRemove) {
        super(COMMAND_CLIENT_ID_CRDT_SEQUENCE);
        this.peer = peer;
        this.onAdd = onAdd;
        this.onRemove = onRemove;
    }

    prepareAdd(out: CommandID, track: number, note: CRDTNote): boolean {
        const dto = Dto.fromCRDTNote(note);
        const payload = encodeDelta({ track, op: 0, note: dto } as CRDTDeltaMsg);
        return this.allocateAndPrepare(out, payload);
    }

    prepareRemove(out: CommandID, track: number, id: NoteID): boolean {
        return this.allocateAndPrepare(out, encodeDelta({ track, op: 1, id: { mac: id.mac.address, ts: id.timestamp } } as CRDTDeltaMsg));
    }

    protected onHandleData(id: CommandID, data: Uint8Array): [boolean, Uint8Array] {
        try {
            const msg = decodeDelta(data);
            // 受信ログ（差分）
            // note: ブラウザ本番では抑制する可能性あり
            console.log('[CRDT][recv][sequence]', {
                from: this.peer,
                track: msg.track,
                op: msg.op,
                size: data?.byteLength ?? 0
            });
            if (msg.op === 0 && msg.note) {
                // note は C++ 実装準拠の2系統に対応
                // - Web独自array形式: [type, pos, id, payload]
                // - Device配列形式:   [id, noteHash, tick, noteType, payload]
                let core;
                if (Array.isArray(msg.note)) {
                    const a = msg.note as unknown as any[];
                    if (a.length >= 5 && (typeof a[3] === 'number')) {
                        core = Dto.deviceNoteFromArray(a);
                    } else {
                        core = Dto.noteFromArray(a);
                    }
                } else {
                    core = Dto.toCRDTNote(msg.note);
                }
                this.onAdd(this.peer, msg.track, core);
                return [true, new Uint8Array()];
            } else if (msg.op === 1 && msg.id) {
                // id も配列形式([macBin, ts])の場合がある
                let idObj: NoteID;
                if (Array.isArray(msg.id)) {
                    const macBin = msg.id[0];
                    const ts = msg.id[1] >>> 0;
                    idObj = { mac: { address: new Uint8Array(macBin) }, timestamp: ts };
                } else {
                    idObj = { mac: { address: new Uint8Array(msg.id.mac) }, timestamp: msg.id.ts };
                }
                this.onRemove(this.peer, msg.track, idObj);
                return [true, new Uint8Array()];
            }
            return [false, new Uint8Array()];
        } catch (e) {
            console.warn('[CRDT][recv][sequence][error]', e);
            return [false, new Uint8Array()];
        }
    }
}


