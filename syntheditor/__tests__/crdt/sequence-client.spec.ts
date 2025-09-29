import { CRDTSequenceClient } from '../../lib/synthevery-core/command/crdt-sequence-client';
import { P2PMacAddress } from '../../types/mesh';
import { CRDTNote, NoteType } from '../../lib/crdt/types';
import { COMMAND_CLIENT_ID_CRDT_SEQUENCE } from '../../lib/synthevery-core/command/constants';
import { Dto } from '../../lib/crdt/dto';
import { encodeDelta } from '../../lib/crdt/msgpack';

describe('CRDTSequenceClient', () => {
    test('onHandleData triggers onAdd', () => {
        const peer: P2PMacAddress = { address: new Uint8Array([1, 2, 3, 4, 5, 6]) };
        let called = false;
        let lastNote: CRDTNote | null = null;
        const client = new CRDTSequenceClient(peer, (_peer, _track, note) => { called = true; lastNote = note; }, (_peer, _track, _id) => { });

        const n: CRDTNote = { type: NoteType.Instrument, pos: { tick: 0, channel: 1, key: 60 }, id: { mac: peer, timestamp: 123 }, payload: { channel: 1, note_num: 60, velocity: 90 } };
        const dto = Dto.fromCRDTNote(n);
        const payload = encodeDelta({ track: 0, op: 0, note: dto } as any);
        const id = { client_id: COMMAND_CLIENT_ID_CRDT_SEQUENCE, type: 0 } as any;
        // call protected via any
        const [ok] = (client as any).onHandleData(id, payload);
        expect(ok).toBe(true);
        expect(called).toBe(true);
        expect(lastNote?.id.timestamp).toBe(123);
    });
});
