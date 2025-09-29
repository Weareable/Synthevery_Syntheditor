import { CRDTNote, MusicalPosition, NoteID, NoteType, ProjectionDelta, macHash64, macToHex } from './types';

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

    addHashXor(): bigint {
        let h = 0n;
        // XOR winner ids (MAC 48b || ts 32b) reduced to 64-bit
        for (const idk of this.winnerIndex.values()) {
            const n = this.addSet.get(idk)!;
            const mac64 = macHash64(n.id.mac);
            const ts = BigInt(n.id.timestamp >>> 0);
            const id64 = ((mac64 << 32n) ^ ts) & 0xFFFFFFFFFFFFFFFFn;
            h ^= id64;
        }
        return h;
    }

    removeHashXor(): bigint {
        let h = 0n;
        for (const idk of this.removeSet.values()) {
            // derive from id string
            const [macHex, tsHex] = idk.split(':');
            const macBytes = new Uint8Array(6);
            for (let i = 0; i < 6; i++) macBytes[i] = parseInt(macHex.substr(i * 2, 2), 16);
            const ts = BigInt(parseInt(tsHex, 16) >>> 0);
            let mac64 = 0n;
            for (let i = 0; i < 6; i++) mac64 = ((mac64 << 8n) ^ BigInt(macBytes[i])) & 0xFFFFFFFFFFFFFFFFn;
            const id64 = ((mac64 << 32n) ^ ts) & 0xFFFFFFFFFFFFFFFFn;
            h ^= id64;
        }
        return h;
    }
}


