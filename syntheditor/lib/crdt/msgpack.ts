import { encode, decode } from '@msgpack/msgpack';
import { CRDTNote } from './types';
import { CRDTDeltaMsg, CRDTNoteMsg, Dto } from './dto';

export function encodeDelta(msg: CRDTDeltaMsg): Uint8Array {
    return encode(msg);
}

export function decodeDelta(bin: Uint8Array): CRDTDeltaMsg {
    const obj = decode(bin) as any;
    return obj as CRDTDeltaMsg;
}

export function packNotes(notes: CRDTNote[]): Uint8Array {
    // device parity: pack as array form
    const arr = notes.map((n) => Dto.noteToArray(n));
    return encode(arr);
}

export function unpackNotes(bin: Uint8Array): CRDTNote[] {
    const arr = decode(bin) as any[];
    // accept both array-form and object-form
    return arr.map((m) => Array.isArray(m) ? Dto.noteFromArray(m) : Dto.toCRDTNote(m as CRDTNoteMsg));
}


