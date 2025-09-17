// types/chordScale.ts

export interface Scale {
    notes: number[];
}

export interface Chord {
    notes: number[];
}

export interface ScaleWithRoot {
    scale_id: number;
    root_offset: number;
}

export interface ChordScaleRelation {
    chord_id: number;
    scale_with_root: ScaleWithRoot;
}

export interface ChordScaleSequenceData {
    chord_ids: number[];
    scale_with_roots: ScaleWithRoot[];
}

export interface ChordScaleSequence {
    tick: number;
    data: ChordScaleSequenceData;
}

export interface ChordScaleConfig {
    scales: Scale[];
    chords: Chord[];
    chord_scale_relations: ChordScaleRelation[];
    sequences: ChordScaleSequence[];
    loop_length_tick: number;
}

