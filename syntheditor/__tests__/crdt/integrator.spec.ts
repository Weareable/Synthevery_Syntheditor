import { NoteOrSet } from '../../lib/crdt/orset';
import { CRDTWebSequencerSync } from '../../lib/synthevery-core/crdt/integrator';
import { CRDTNote, NoteType } from '../../lib/crdt/types';

class MemEditor {
    ops: string[] = [];
    clearAll() { this.ops.push('clear'); }
    removeInstrumentInRange(c: number, n: number, s: number, e: number) { this.ops.push(`ri:${c}:${n}:${s}-${e}`); }
    removeEffectInRange(c: number, id: number, s: number, e: number) { this.ops.push(`re:${c}:${id}:${s}-${e}`); }
    addInstrument(c: number, n: number, t: number, v: number) { this.ops.push(`ai:${c}:${n}:${t}:${v}`); }
    addEffect(c: number, id: number, t: number, val: number) { this.ops.push(`ae:${c}:${id}:${t}:${val}`); }
}

describe('CRDTWebSequencerSync', () => {
    test('delta add -> apply at next tick', () => {
        const set = new NoteOrSet();
        const ed = new (MemEditor as any)();
        const sync = new CRDTWebSequencerSync(set, ed);

        const peer = { address: new Uint8Array([1, 2, 3, 4, 5, 6]) };
        const n: CRDTNote = { type: NoteType.Instrument, pos: { tick: 4, channel: 1, key: 60 }, id: { mac: peer, timestamp: 100 }, payload: { channel: 1, note_num: 60, velocity: 90 } };

        sync.onDeltaAdd(peer as any, 0, n);
        // no apply before tick
        expect(ed.ops.length).toBe(0);

        sync.onTick(4);
        expect(ed.ops.join(',')).toContain('ai:1:60:4:90');
    });
});

