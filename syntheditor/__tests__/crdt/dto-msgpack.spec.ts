import { packNotes, unpackNotes, encodeDelta, decodeDelta } from '../../lib/crdt/msgpack';
import { CRDTNote, NoteType } from '../../lib/crdt/types';
import { P2PMacAddress } from '../../types/mesh';

function mac(bytes: number[]): P2PMacAddress {
    return { address: Uint8Array.from(bytes) } as P2PMacAddress;
}

function note(ts: number): CRDTNote {
    const ch = 1, key = 60, tick = 0;
    return {
        type: NoteType.Instrument,
        pos: { tick, channel: ch, key },
        id: { mac: mac([1, 2, 3, 4, 5, 6]), timestamp: ts >>> 0 },
        payload: { channel: ch, note_num: key, velocity: 80 },
    };
}

describe('DTO/MsgPack', () => {
    test('pack/unpack full projection (array form)', () => {
        const src = [note(100), note(200)];
        const bin = packNotes(src);
        const dst = unpackNotes(bin);
        expect(dst.length).toBe(2);
        expect(dst[0].id.timestamp).toBe(100);
        expect(dst[1].id.timestamp).toBe(200);
    });

    test('delta encode/decode', () => {
        const add = { track: 0, op: 0, note: { type: 0, pos: { tick: 0, channel: 1, key: 60 }, id: { mac: new Uint8Array([1, 2, 3, 4, 5, 6]), ts: 100 }, payload: { channel: 1, note_num: 60, velocity: 90 } } };
        const bin = encodeDelta(add as any);
        const out = decodeDelta(bin);
        expect(out.op).toBe(0);
        expect(out.note?.id.ts).toBe(100);
    });
});


