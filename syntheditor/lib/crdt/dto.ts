import { CRDTNote, EffectNote, InstrumentNote, MusicalPosition, NoteID, NoteType, macToBytes } from './types';
import { P2PMacAddress } from '../../types/mesh';

export interface NoteIDMsg { mac: Uint8Array; ts: number; }
export interface InstrumentNoteMsg { channel: number; note_num: number; velocity: number; }
export interface EffectNoteMsg { channel: number; effect_id: number; value: number; }
export interface MusicalPositionMsg { tick: number; channel: number; key: number; }

export interface CRDTNoteMsg {
    type: number; // 0 inst, 1 eff
    pos: MusicalPositionMsg;
    id: NoteIDMsg;
    payload: InstrumentNoteMsg | EffectNoteMsg;
}

export interface CRDTDeltaMsg {
    track: number;
    op: number; // 0 add, 1 remove
    note?: CRDTNoteMsg;
    id?: NoteIDMsg;
}

export const Dto = {
    fromNoteID(src: NoteID): NoteIDMsg {
        return { mac: macToBytes(src.mac), ts: src.timestamp >>> 0 };
    },
    toNoteID(msg: NoteIDMsg): NoteID {
        return { mac: { address: new Uint8Array(msg.mac) }, timestamp: msg.ts >>> 0 } as NoteID;
    },
    fromInstrument(src: InstrumentNote): InstrumentNoteMsg {
        return { channel: src.channel, note_num: src.note_num, velocity: src.velocity };
    },
    fromEffect(src: EffectNote): EffectNoteMsg {
        return { channel: src.channel, effect_id: src.effect_id, value: src.value };
    },
    fromPos(src: MusicalPosition): MusicalPositionMsg {
        return { tick: src.tick, channel: src.channel, key: src.key };
    },
    toInstrument(msg: InstrumentNoteMsg): InstrumentNote {
        return { channel: msg.channel, note_num: msg.note_num, velocity: msg.velocity };
    },
    toEffect(msg: EffectNoteMsg): EffectNote {
        return { channel: msg.channel, effect_id: msg.effect_id, value: msg.value };
    },
    toPos(msg: MusicalPositionMsg): MusicalPosition {
        return { tick: msg.tick, channel: msg.channel, key: msg.key };
    },
    fromCRDTNote(n: CRDTNote): CRDTNoteMsg {
        const type = n.type === NoteType.Instrument ? 0 : 1;
        const id = this.fromNoteID(n.id);
        const pos = this.fromPos(n.pos);
        const payload = n.type === NoteType.Instrument ? this.fromInstrument(n.payload as InstrumentNote) : this.fromEffect(n.payload as EffectNote);
        return { type, id, pos, payload };
    },
    toCRDTNote(m: CRDTNoteMsg): CRDTNote {
        const type = m.type === 0 ? NoteType.Instrument : NoteType.Effect;
        const id = this.toNoteID(m.id);
        const pos = this.toPos(m.pos);
        const payload = m.type === 0 ? this.toInstrument(m.payload as InstrumentNoteMsg) : this.toEffect(m.payload as EffectNoteMsg);
        return { type, id, pos, payload };
    },

    // Array-form encoding/decoding (device parity)
    // CRDTNoteMsg as array: [type, [tick,channel,key], [[mac6], ts], payloadArray]
    noteToArray(n: CRDTNote): any[] {
        const type = n.type === NoteType.Instrument ? 0 : 1;
        const pos = [n.pos.tick, n.pos.channel, n.pos.key];
        const id = [[(n.id.mac.address as any)] as any, n.id.timestamp >>> 0];
        const payload = type === 0
            ? [(n.payload as InstrumentNote).channel, (n.payload as InstrumentNote).note_num, (n.payload as InstrumentNote).velocity]
            : [(n.payload as EffectNote).channel, (n.payload as EffectNote).effect_id, (n.payload as EffectNote).value];
        return [type, pos, id, payload];
    },
    noteFromArray(a: any[]): CRDTNote {
        const type = a[0] === 0 ? NoteType.Instrument : NoteType.Effect;
        const posA = a[1];
        const idA = a[2];
        const payloadA = a[3];
        const pos: MusicalPosition = { tick: posA[0], channel: posA[1], key: posA[2] };
        const macArr: Uint8Array = new Uint8Array(idA[0][0]);
        const id: NoteID = { mac: { address: macArr }, timestamp: idA[1] >>> 0 };
        const payload = a[0] === 0
            ? { channel: payloadA[0], note_num: payloadA[1], velocity: payloadA[2] } as InstrumentNote
            : { channel: payloadA[0], effect_id: payloadA[1], value: payloadA[2] } as EffectNote;
        return { type, pos, id, payload };
    },
};


