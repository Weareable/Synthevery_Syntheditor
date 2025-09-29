import { CRDTAuditClient } from '../../lib/synthevery-core/command/crdt-audit-client';
import { CRDTFullStateClient } from '../../lib/synthevery-core/command/crdt-full-state';
import { P2PMacAddress } from '../../types/mesh';
import { CRDTNote, NoteType } from '../../lib/crdt/types';

function peer(): P2PMacAddress { return { address: new Uint8Array([1, 2, 3, 4, 5, 6]) }; }

describe('CRDT audit/full clients', () => {
    test('audit onHandleData', () => {
        const p = peer();
        let received: Uint8Array | null = null;
        const client = new CRDTAuditClient(p, () => new Uint8Array([0xAA]), (_peer, data) => { received = data; });
        const [ok] = (client as any).onHandleData({ client_id: client.getClientID(), type: 0 }, new Uint8Array([0x01, 0x02]));
        expect(ok).toBe(true);
        expect(received).not.toBeNull();
        expect(received![0]).toBe(0x01);
    });

    test('full-state onHandleData', () => {
        const p = peer();
        let applied: CRDTNote[] | null = null;
        const notes: CRDTNote[] = [{ type: NoteType.Instrument, pos: { tick: 0, channel: 1, key: 60 }, id: { mac: p, timestamp: 10 }, payload: { channel: 1, note_num: 60, velocity: 100 } }];
        const client = new CRDTFullStateClient(p, () => notes, (_peer, recv) => { applied = recv; });

        // pack and feed back
        const payload = new Uint8Array([0x90]); // empty array (use msgpack minimal invalid? Instead call unpack via API)
        // Better: use packNotes from msgpack
        const { packNotes } = require('../../lib/crdt/msgpack');
        const bin = packNotes(notes);
        const [ok] = (client as any).onHandleData({ client_id: client.getClientID(), type: 0 }, bin);
        expect(ok).toBe(true);
        expect(applied).not.toBeNull();
        expect(applied![0].id.timestamp).toBe(10);
    });
});
