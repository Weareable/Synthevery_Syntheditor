import { NoteOrSet } from '../../../lib/crdt/orset';
import { ScoreEditor, CRDTScoreBridgeWeb } from '../../../lib/crdt/score-bridge';
import { CRDTNote, NoteID } from '../../../lib/crdt/types';
import { CrdtApplyHook } from '../../../lib/crdt/apply-hook';
import { P2PMacAddress } from '../../types/mesh';

// High-level wiring used by UI and tests to connect CRDT deltas to a ScoreEditor
export class CRDTWebSequencerSync {
    private readonly set: NoteOrSet;
    private readonly editor: ScoreEditor;
    private readonly applyHook: CrdtApplyHook;

    constructor(set: NoteOrSet, editor: ScoreEditor) {
        this.set = set;
        this.editor = editor;
        this.applyHook = new CrdtApplyHook(set, editor);
    }

    onDeltaAdd(_peer: P2PMacAddress, _track: number, note: CRDTNote): void {
        this.set.add(note);
    }

    onDeltaRemove(_peer: P2PMacAddress, _track: number, id: NoteID): void {
        this.set.remove(id);
    }

    onFullState(_peer: P2PMacAddress, notes: CRDTNote[]): void {
        CRDTScoreBridgeWeb.rebuild(this.editor, notes);
    }

    onTick(tick: number): void {
        this.applyHook.onTick(tick);
    }
}



