import { NoteOrSet } from '../crdt/orset';
import { ScoreEditor } from '../crdt/score-bridge';
import { CRDTWebSequencerSync } from '../synthevery-core/crdt/integrator';
import { CRDTSyncHandlers } from '../synthevery-core/crdt/crdt-sync';

function bigintToLeBytes64(x: bigint): Uint8Array { const b = new Uint8Array(8); let v = x; for (let i = 0; i < 8; i++) { b[i] = Number(v & 0xffn); v >>= 8n; } return b; }

type ServicesLike = { crdtSyncManager: { setHandlers: (h: Partial<CRDTSyncHandlers>) => void } };

export function setupCrdtSync(services: ServicesLike, editor: ScoreEditor, set: NoteOrSet) {
    const sync = new CRDTWebSequencerSync(set, editor);
    services.crdtSyncManager.setHandlers({
        onAdd: (peer, track, note) => sync.onDeltaAdd(peer as any, track, note),
        onRemove: (peer, track, id) => sync.onDeltaRemove(peer as any, track, id),
        onReceiveFull: (peer, notes) => sync.onFullState(peer as any, notes),
        getAuditPayload: () => bigintToLeBytes64(set.addHashXor() ^ set.removeHashXor()),
    });
    return {
        onTick: (tick: number) => sync.onTick(tick),
        set,
    };
}


