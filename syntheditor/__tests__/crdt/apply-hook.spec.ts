import { NoteOrSet } from '../../lib/crdt/orset';
import { CrdtApplyHook } from '../../lib/crdt/apply-hook';
import { CRDTNote, NoteType } from '../../lib/crdt/types';

class MemEditor {
    ops: string[] = [];
    clearAll() { this.ops.push('clear'); }
    removeInstrumentInRange(c: number, n: number, s: number, e: number) { this.ops.push(`ri:${c}:${n}:${s}-${e}`); }
    removeEffectInRange(c: number, id: number, s: number, e: number) { this.ops.push(`re:${c}:${id}:${s}-${e}`); }
    addInstrument(c: number, n: number, t: number, v: number) { this.ops.push(`ai:${c}:${n}:${t}:${v}`); }
    addEffect(c: number, id: number, t: number, val: number) { this.ops.push(`ae:${c}:${id}:${t}:${val}`); }
}

describe('CrdtApplyHook', () => {
    test('applies deltas only at new ticks', () => {
        const set = new NoteOrSet();
        const ed = new (MemEditor as any)();
        const hook = new CrdtApplyHook(set, ed);

        const n: CRDTNote = { type: NoteType.Instrument, pos: { tick: 0, channel: 1, key: 60 }, id: { mac: { address: new Uint8Array([1, 2, 3, 4, 5, 6]) }, timestamp: 1 }, payload: { channel: 1, note_num: 60, velocity: 90 } };
        set.add(n);

        hook.onTick(0);
        expect(ed.ops.join(',')).toContain('ai:1:60:0:90');

        const lenAfter = ed.ops.length;
        // same tick -> no re-apply
        hook.onTick(0);
        expect(ed.ops.length).toBe(lenAfter);
    });
});

