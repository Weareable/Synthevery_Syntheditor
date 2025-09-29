import { CRDTNote, NoteType, ProjectionDelta } from './types';

export interface ScoreEditor {
    clearAll(): void;
    removeInstrumentInRange(channel: number, noteNum: number, startTick: number, endTick: number): void;
    removeEffectInRange(channel: number, effectId: number, startTick: number, endTick: number): void;
    addInstrument(channel: number, noteNum: number, tick: number, velocity: number): void;
    addEffect(channel: number, effectId: number, tick: number, value: number): void;
}

export class CRDTScoreBridgeWeb {
    static applyDeltas(editor: ScoreEditor, deltas: ProjectionDelta[]): void {
        for (const d of deltas) {
            if (d.kind === 'remove') {
                const start = d.pos.tick;
                const end = d.pos.tick + 1; // half-open [tick, tick+1)
                if (d.type === NoteType.Instrument) {
                    editor.removeInstrumentInRange(d.pos.channel, d.pos.key, start, end);
                } else {
                    editor.removeEffectInRange(d.pos.channel, d.pos.key, start, end);
                }
            } else {
                const n = d.note;
                const start = n.pos.tick;
                const end = n.pos.tick + 1;
                // ensure idempotent upsert: remove winner at same position first
                if (n.type === NoteType.Instrument) {
                    editor.removeInstrumentInRange(n.pos.channel, (n.payload as any).note_num, start, end);
                    editor.addInstrument(n.pos.channel, (n.payload as any).note_num, n.pos.tick, (n.payload as any).velocity);
                } else {
                    editor.removeEffectInRange(n.pos.channel, (n.payload as any).effect_id, start, end);
                    editor.addEffect(n.pos.channel, (n.payload as any).effect_id, n.pos.tick, (n.payload as any).value);
                }
            }
        }
    }

    static rebuild(editor: ScoreEditor, notes: CRDTNote[]): void {
        editor.clearAll();
        for (const n of notes) {
            if (n.type === NoteType.Instrument) {
                editor.addInstrument(n.pos.channel, (n.payload as any).note_num, n.pos.tick, (n.payload as any).velocity);
            } else {
                editor.addEffect(n.pos.channel, (n.payload as any).effect_id, n.pos.tick, (n.payload as any).value);
            }
        }
    }
}


