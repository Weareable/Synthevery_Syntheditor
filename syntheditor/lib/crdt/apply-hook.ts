import { NoteOrSet } from './orset';
import { CRDTScoreBridgeWeb, ScoreEditor } from './score-bridge';

export class CrdtApplyHook {
    private readonly set: NoteOrSet;
    private readonly editor: ScoreEditor;
    private lastAppliedTick: number = -1;

    constructor(set: NoteOrSet, editor: ScoreEditor) {
        this.set = set;
        this.editor = editor;
    }

    onTick(currentTick: number): void {
        if (currentTick === this.lastAppliedTick) return;
        const deltas = this.set.popProjectionDeltas();
        if (deltas.length > 0) {
            CRDTScoreBridgeWeb.applyDeltas(this.editor, deltas);
        }
        this.lastAppliedTick = currentTick;
    }
}



