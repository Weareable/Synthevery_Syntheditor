import { CRDTNote, MusicalPosition, NoteID, NoteType, ProjectionDelta, macToHex } from './types';

type NoteKey = string; // pos key: `${tick}:${channel}:${key}:${type}`

function posKey(pos: MusicalPosition, type: NoteType): NoteKey {
    return `${pos.tick}:${pos.channel}:${pos.key}:${type}`;
}

function idKey(id: NoteID): string {
    // MAC(6B)+timestamp encoded to hex for determinism
    const macHex = macToHex(id.mac);
    const tsHex = (id.timestamp >>> 0).toString(16).padStart(8, '0');
    return `${macHex}:${tsHex}`;
}

export class NoteOrSet {
    private addSet = new Map<string, CRDTNote>(); // idKey -> note
    private removeSet = new Set<string>(); // idKey tombstones

    private winnerIndex = new Map<NoteKey, string>(); // posKey -> idKey
    private candidates = new Map<NoteKey, string[]>(); // posKey -> sorted idKeys (oldest..newest)
    private deltaQueue: ProjectionDelta[] = [];

    add(note: CRDTNote): void {
        const ik = idKey(note.id);
        if (this.removeSet.has(ik)) {
            // resurrect allowed by OR-Set semantics (observed-remove)
            this.removeSet.delete(ik);
        }
        this.addSet.set(ik, note);
        const pk = posKey(note.pos, note.type);
        const list = this.candidates.get(pk) ?? [];
        if (!list.includes(ik)) {
            list.push(ik);
            // sort by timestamp ascending (oldest first)
            list.sort((a, b) => (this.addSet.get(a)!.id.timestamp | 0) - (this.addSet.get(b)!.id.timestamp | 0));
            this.candidates.set(pk, list);
        }

        const prevWinner = this.winnerIndex.get(pk);
        const newWinner = list[list.length - 1];
        if (prevWinner !== newWinner) {
            if (prevWinner) {
                // remove previous
                const prev = this.addSet.get(prevWinner)!;
                this.deltaQueue.push({ kind: 'remove', pos: prev.pos, type: prev.type });
            }
            this.winnerIndex.set(pk, newWinner);
            this.deltaQueue.push({ kind: 'add', note });
        } else {
            // same winner, no projection change when older candidate added
        }
    }

    remove(id: NoteID): void {
        const ik = idKey(id);
        if (this.removeSet.has(ik)) return; // idempotent
        this.removeSet.add(ik);
        const note = this.addSet.get(ik);
        if (!note) return; // unknown add not present yet
        const pk = posKey(note.pos, note.type);
        // remove from candidates
        const list = this.candidates.get(pk) ?? [];
        const idx = list.indexOf(ik);
        if (idx >= 0) list.splice(idx, 1);
        if (list.length === 0) this.candidates.delete(pk); else this.candidates.set(pk, list);

        const prevWinner = this.winnerIndex.get(pk);
        if (prevWinner === ik) {
            // re-elect
            if (list.length > 0) {
                const newWinner = list[list.length - 1];
                this.winnerIndex.set(pk, newWinner);
                const winNote = this.addSet.get(newWinner)!;
                this.deltaQueue.push({ kind: 'remove', pos: note.pos, type: note.type });
                this.deltaQueue.push({ kind: 'add', note: winNote });
            } else {
                this.winnerIndex.delete(pk);
                this.deltaQueue.push({ kind: 'remove', pos: note.pos, type: note.type });
            }
        } else {
            // removing non-winner does not change projection
        }
    }

    clear(): void {
        this.addSet.clear();
        this.removeSet.clear();
        this.winnerIndex.clear();
        this.candidates.clear();
        // full rebuild implied: caller should rebuild projection
    }

    buildFullProjection(): CRDTNote[] {
        const result: CRDTNote[] = [];
        for (const [pk, winner] of this.winnerIndex.entries()) {
            const n = this.addSet.get(winner);
            if (!n) continue;
            if (this.removeSet.has(winner)) continue;
            result.push(n);
        }
        // stable sort by position then timestamp
        result.sort((a, b) => a.pos.tick - b.pos.tick || a.pos.channel - b.pos.channel || a.pos.key - b.pos.key || a.id.timestamp - b.id.timestamp);
        return result;
    }

    popProjectionDeltas(): ProjectionDelta[] {
        const out = this.deltaQueue;
        this.deltaQueue = [];
        return out;
    }

    private computeNoteHash(n: CRDTNote): number {
        // デバイス互換: PlayerModule.h と crdt_orset.hpp に合わせる
        const tick = n.pos.tick >>> 0;
        if (n.type === NoteType.Instrument) {
            const ch = (n.payload as any).channel >>> 0;
            const nn = (n.payload as any).note_num >>> 0;
            const vel = (n.payload as any).velocity >>> 0;
            return (((ch & 0xff) << 24) ^ ((nn & 0xff) << 16) ^ ((vel & 0xff) << 8) ^ (tick & 0xffffffff)) >>> 0;
        } else {
            const ch = (n.payload as any).channel >>> 0;
            const id = (n.payload as any).effect_id >>> 0;
            const val = (n.payload as any).value >>> 0;
            return (((ch & 0xff) << 24) ^ ((id & 0xffff) << 12) ^ ((val & 0xff) << 4) ^ (tick & 0xffffffff)) >>> 0;
        }
    }

    addHashXor(): number {
        let h = 0 >>> 0;
        for (const n of this.addSet.values()) {
            h = (h ^ this.computeNoteHash(n)) >>> 0;
        }
        return h >>> 0;
    }

    removeHashXor(): number {
        let h = 0 >>> 0;
        for (const idk of this.removeSet.values()) {
            const n = this.addSet.get(idk);
            if (!n) continue; // デバイスと同様: add がある tombstone のみ XOR
            h = (h ^ this.computeNoteHash(n)) >>> 0;
        }
        return h >>> 0;
    }

    // フル同期: 現在のadd要素を全件取得
    getAllAdds(): CRDTNote[] {
        const result: CRDTNote[] = [];
        for (const note of this.addSet.values()) {
            result.push(note);
        }
        return result;
    }

    // フル同期: 現在のremoveトゥームストーンを全件取得
    getAllRemoveIds(): NoteID[] {
        const ids: NoteID[] = [];
        for (const idk of this.removeSet.values()) {
            const [macHex, tsHex] = idk.split(':');
            const macBytes = new Uint8Array(6);
            for (let i = 0; i < 6; i++) macBytes[i] = parseInt(macHex.substr(i * 2, 2), 16);
            const ts = parseInt(tsHex, 16) >>> 0;
            ids.push({ mac: { address: macBytes }, timestamp: ts });
        }
        return ids;
    }

    // フル同期適用（受信したadds/removesで再構築）
    applyFullJoin(adds: CRDTNote[], removes: NoteID[]): void {
        this.addSet.clear();
        this.removeSet.clear();
        this.winnerIndex.clear();
        this.candidates.clear();
        this.deltaQueue = [];
        // まずaddsをすべて取り込む（勝者選出はaddで自動）
        for (const n of adds) this.add(n);
        // tombstoneを反映
        for (const id of removes) this.remove(id);
    }
}


