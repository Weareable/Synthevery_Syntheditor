import { NoteOrSet } from '../../lib/crdt/orset';
import { CRDTNote, NoteType } from '../../lib/crdt/types';
import { P2PMacAddress } from '@/types/mesh';

function mac(i: number) {
    return { address: Uint8Array.from([0, 1, 2, 3, 4, i & 0xff]) } as P2PMacAddress;
}

function note(tick: number, channel: number, key: number, ts: number, type: NoteType = NoteType.Instrument): CRDTNote {
    return {
        type,
        pos: { tick, channel, key },
        id: { mac: mac(0xAA), timestamp: ts >>> 0 },
        payload: type === NoteType.Instrument ? { channel, note_num: key, velocity: 100 } : { channel, effect_id: key, value: 64 },
    };
}

describe('NoteOrSet', () => {
    test('add then replace winner at same position', () => {
        const s = new NoteOrSet();
        s.add(note(10, 1, 60, 100));
        let deltas = s.popProjectionDeltas();
        expect(deltas.length).toBe(1);
        expect(deltas[0].kind).toBe('add');

        s.add(note(10, 1, 60, 200));
        deltas = s.popProjectionDeltas();
        expect(deltas.length).toBe(2); // remove old winner, add new
        expect(deltas[0].kind).toBe('remove');
        expect(deltas[1].kind).toBe('add');

        const proj = s.buildFullProjection();
        expect(proj.length).toBe(1);
        expect(proj[0].id.timestamp).toBe(200);
    });

    test('remove winner re-elects older', () => {
        const s = new NoteOrSet();
        const n1 = note(0, 1, 60, 100);
        const n2 = note(0, 1, 60, 200);
        s.add(n1);
        s.add(n2);
        s.popProjectionDeltas();

        s.remove(n2.id);
        const deltas = s.popProjectionDeltas();
        expect(deltas.length).toBe(2);
        expect(deltas[0].kind).toBe('remove');
        expect(deltas[1].kind).toBe('add'); // n1 becomes winner
        const proj = s.buildFullProjection();
        expect(proj[0].id.timestamp).toBe(100);
    });
});


