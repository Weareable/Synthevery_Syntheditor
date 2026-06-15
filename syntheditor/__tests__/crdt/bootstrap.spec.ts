import { setupCrdtSync } from '../../lib/app/crdt-bootstrap';
import { NoteOrSet } from '../../lib/crdt/orset';
import { CRDTNote, NoteType } from '../../lib/crdt/types';

class MemEditor {
    ops: string[] = [];
    clearAll() { this.ops.push('clear'); }
    removeInstrumentInRange(c: number, n: number, s: number, e: number) { this.ops.push(`ri:${c}:${n}:${s}-${e}`); }
    removeEffectInRange(c: number, id: number, s: number, e: number) { this.ops.push(`re:${c}:${id}:${s}-${e}`); }
    addInstrument(c: number, n: number, t: number, v: number) { this.ops.push(`ai:${c}:${n}:${t}:${v}`); }
    addEffect(c: number, id: number, t: number, val: number) { this.ops.push(`ae:${c}:${id}:${t}:${val}`); }
}

describe('setupCrdtSync', () => {
    test('wires handlers and applies at tick', () => {
        const services: any = { crdtSyncManager: { setHandlers: (h: any) => { services._h = h; } } };
        const set = new NoteOrSet();
        const ed = new (MemEditor as any)();
        const api = setupCrdtSync(services, [ed], [set]);

        const peer = { address: new Uint8Array([1, 2, 3, 4, 5, 6]) };
        const n: CRDTNote = { type: NoteType.Instrument, pos: { tick: 7, channel: 2, key: 61 }, id: { mac: peer as any, timestamp: 321 }, payload: { channel: 2, note_num: 61, velocity: 70 } };

        // simulate incoming delta add
        services._h.onAdd(peer, 0, n);
        api.onTick(7);
        expect(ed.ops.join(',')).toContain('ai:2:61:7:70');

        // simulate full state
        services._h.onReceiveFullMulti(peer, [{ track: 0, adds: [n], removes: [] }]);
        expect(ed.ops[ed.ops.length - 2]).toBe('clear');
    });
});



