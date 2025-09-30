import { EventEmitter } from 'events'
import { NoteOrSet } from '@/lib/crdt/orset'
import { CRDTNote, NoteType } from '@/lib/crdt/types'
import { CRDTScoreBridgeWeb, ScoreEditor } from '@/lib/crdt/score-bridge'

export type TrackProjectionNote = {
    tick: number
    type: NoteType
    channel: number
    key: number
}

export type TrackProjection = {
    trackIndex: number
    notes: TrackProjectionNote[]
}

export class CrdtProjectionStore {
    private sets: NoteOrSet[]
    private editors: ScoreEditor[]
    private presentMaps: Map<string, true>[]
    public readonly eventEmitter = new EventEmitter()

    constructor(trackCount: number) {
        this.sets = Array(trackCount).fill(null).map(() => new NoteOrSet())
        this.presentMaps = Array(trackCount).fill(null).map(() => new Map<string, true>())
        this.editors = this.presentMaps.map((m, trackIndex) => this.createEditorForMap(m, trackIndex))
    }

    getSets(): NoteOrSet[] { return this.sets }
    getEditors(): ScoreEditor[] { return this.editors }

    // CRDTSyncManager ハンドラから利用
    onAdd(track: number, note: CRDTNote): void {
        this.ensureTrackIndex(track)
        const set = this.sets[track]
        if (!set) return
        set.add(note)
        this.applyPendingDeltas(track)
        this.eventEmitter.emit('updated')
    }

    onRemove(track: number, id: CRDTNote['id']): void {
        this.ensureTrackIndex(track)
        const set = this.sets[track]
        if (!set) return
        set.remove(id)
        this.applyPendingDeltas(track)
        this.eventEmitter.emit('updated')
    }

    onReceiveFullMulti(tracks: { track: number; adds: CRDTNote[]; removes: CRDTNote['id'][] }[]): void {
        for (const t of tracks) {
            const ti = t.track >>> 0
            this.ensureTrackIndex(ti)
            const set = this.sets[ti]
            const ed = this.editors[ti]
            if (!set || !ed) continue
            set.applyFullJoin(t.adds, t.removes)
            CRDTScoreBridgeWeb.rebuild(ed, set.buildFullProjection())
        }
        this.eventEmitter.emit('updated')
    }

    onReceiveFullSingle(notes: CRDTNote[]): void {
        const set = this.sets[0]
        const ed = this.editors[0]
        if (!set || !ed) return
        CRDTScoreBridgeWeb.rebuild(ed, notes)
        this.eventEmitter.emit('updated')
    }

    getFullStateMulti(): { adds: CRDTNote[]; removes: CRDTNote['id'][] }[] {
        return this.sets.map(s => ({ adds: s.getAllAdds(), removes: s.getAllRemoveIds() }))
    }

    getFullStateSingle(): CRDTNote[] { return this.sets[0] ? this.sets[0].getAllAdds() : [] }

    getTrackProjections(): TrackProjection[] {
        return this.presentMaps.map((m, idx) => ({
            trackIndex: idx,
            notes: Array.from(m.keys()).map(k => {
                const [tick, type, channel, key] = k.split(':').map(x => parseInt(x, 10))
                return { tick, type: type as NoteType, channel, key }
            }).sort((a, b) => a.tick - b.tick || a.channel - b.channel || a.key - b.key),
        }))
    }

    private createEditorForMap(map: Map<string, true>, _trackIndex: number): ScoreEditor {
        const keyOf = (type: NoteType, channel: number, key: number, tick: number) => `${tick}:${type}:${channel}:${key}`
        return {
            clearAll: () => {
                map.clear()
            },
            removeInstrumentInRange: (channel, noteNum, startTick, endTick) => {
                for (let t = startTick; t < endTick; t++) {
                    map.delete(keyOf(NoteType.Instrument, channel, noteNum, t))
                }
            },
            removeEffectInRange: (channel, effectId, startTick, endTick) => {
                for (let t = startTick; t < endTick; t++) {
                    map.delete(keyOf(NoteType.Effect, channel, effectId, t))
                }
            },
            addInstrument: (channel, noteNum, tick, _velocity) => {
                map.set(keyOf(NoteType.Instrument, channel, noteNum, tick), true)
            },
            addEffect: (channel, effectId, tick, _value) => {
                map.set(keyOf(NoteType.Effect, channel, effectId, tick), true)
            },
        }
    }

    private applyPendingDeltas(track: number): void {
        const set = this.sets[track]
        const editor = this.editors[track]
        if (!set || !editor) return
        const deltas = set.popProjectionDeltas()
        if (deltas.length > 0) {
            CRDTScoreBridgeWeb.applyDeltas(editor, deltas)
        }
    }

    private ensureTrackIndex(index: number): void {
        while (this.sets.length <= index) {
            this.sets.push(new NoteOrSet())
            const m = new Map<string, true>()
            this.presentMaps.push(m)
            this.editors.push(this.createEditorForMap(m, this.editors.length))
        }
    }
}


