import { P2PMacAddress } from '../../types/mesh';
export type Byte = number;

export function macToBytes(mac: P2PMacAddress): Uint8Array {
    return new Uint8Array(mac.address);
}

export function macToHex(mac: P2PMacAddress): string {
    return Array.from(mac.address)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

export function macHash64(mac: P2PMacAddress): bigint {
    let h = 0n;
    const bytes = mac.address;
    for (let i = 0; i < 6; i++) {
        h = (h << 8n) ^ BigInt(bytes[i]);
        h &= 0xFFFFFFFFFFFFFFFFn;
    }
    return h;
}

export enum NoteType {
    Instrument = 0,
    Effect = 1,
}

export interface NoteID {
    mac: P2PMacAddress;
    timestamp: number; // uint32
}

export interface MusicalPosition {
    tick: number; // int32
    channel: number; // uint8
    // For instrument: noteNum, for effect: effectId
    key: number; // uint8 or small int
}

export interface InstrumentNote {
    channel: number;
    note_num: number;
    velocity: number;
}

export interface EffectNote {
    channel: number;
    effect_id: number;
    value: number; // intensity/amount
}

export interface CRDTNote {
    type: NoteType;
    pos: MusicalPosition;
    id: NoteID;
    payload: InstrumentNote | EffectNote;
}

export interface ProjectionDeltaAdd {
    kind: "add";
    note: CRDTNote;
}

export interface ProjectionDeltaRemove {
    kind: "remove";
    pos: MusicalPosition;
    type: NoteType;
}

export type ProjectionDelta = ProjectionDeltaAdd | ProjectionDeltaRemove;


