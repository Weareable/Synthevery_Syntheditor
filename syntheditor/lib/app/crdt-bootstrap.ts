import { NoteOrSet } from '../crdt/orset';
import { ScoreEditor, CRDTScoreBridgeWeb } from '../crdt/score-bridge';
import { CRDTWebSequencerSync } from '../synthevery-core/crdt/integrator';
import { CRDTSyncHandlers } from '../synthevery-core/crdt/crdt-sync';

type ServicesLike = { crdtSyncManager: { setHandlers: (h: Partial<CRDTSyncHandlers>) => void } };

export function setupCrdtSync(
    services: ServicesLike,
    editors: ScoreEditor[],
    sets: NoteOrSet[],
) {
    const syncs = sets.map((s, i) => new CRDTWebSequencerSync(s, editors[i]));
    services.crdtSyncManager.setHandlers({
        onAdd: (peer, track, note) => { if (syncs[track]) syncs[track].onDeltaAdd(peer as any, track, note); },
        onRemove: (peer, track, id) => { if (syncs[track]) syncs[track].onDeltaRemove(peer as any, track, id); },
        onReceiveFull: (peer, notes) => { if (syncs[0]) syncs[0].onFullState(peer as any, notes); },
        onReceiveFullMulti: (_peer, tracks) => {
            for (const t of tracks) {
                const ti = t.track >>> 0;
                if (!sets[ti] || !editors[ti]) continue;
                sets[ti].applyFullJoin(t.adds, t.removes);
                CRDTScoreBridgeWeb.rebuild(editors[ti], sets[ti].buildFullProjection());
            }
        },
        getAuditPayload: () => {
            // デバイス互換: 先頭4B=addXor32, 次の4B=removeXor32 (LE)
            let add = 0 >>> 0;
            let rem = 0 >>> 0;
            for (const s of sets) {
                add = (add ^ (s.addHashXor() >>> 0)) >>> 0;
                rem = (rem ^ (s.removeHashXor() >>> 0)) >>> 0;
            }
            const out = new Uint8Array(8);
            out[0] = add & 0xff; out[1] = (add >>> 8) & 0xff; out[2] = (add >>> 16) & 0xff; out[3] = (add >>> 24) & 0xff;
            out[4] = rem & 0xff; out[5] = (rem >>> 8) & 0xff; out[6] = (rem >>> 16) & 0xff; out[7] = (rem >>> 24) & 0xff;
            return out;
        },
        getFullStateMulti: () => sets.map(s => ({ adds: s.getAllAdds(), removes: s.getAllRemoveIds() })),
        getFullState: () => (sets[0] ? sets[0].getAllAdds() : []),
    });
    return {
        onTick: (tick: number) => syncs.forEach(s => s.onTick(tick)),
        sets,
    };
}


// マルチトラック版: editors と sets を同じ長さの配列で受け取る
// removed alias: setupCrdtSync is the unified multi-track entry point


