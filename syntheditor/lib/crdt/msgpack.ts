import { encode, decode } from '@msgpack/msgpack';
import { CRDTNote } from './types';
import { CRDTDeltaMsg, CRDTNoteMsg, Dto } from './dto';

export function encodeDelta(msg: CRDTDeltaMsg): Uint8Array {
    // device parity: prefer array-form [track, op, noteOrId]
    try {
        if (msg.op === 0 && msg.note) {
            return encode([msg.track, msg.op, msg.note]);
        } else if (msg.op === 1 && msg.id) {
            return encode([msg.track, msg.op, msg.id]);
        }
    } catch (_e) {
        // fallback to object-form
    }
    return encode(msg);
}

export function decodeDelta(bin: Uint8Array): CRDTDeltaMsg {
    const obj = decode(bin) as any;
    if (Array.isArray(obj)) {
        const [track, op, third] = obj;
        if (op === 0) return { track, op, note: third } as CRDTDeltaMsg;
        if (op === 1) return { track, op, id: third } as CRDTDeltaMsg;
    }
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


