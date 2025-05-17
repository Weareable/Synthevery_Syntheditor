export interface TickClockState {
    playing: boolean;
    bpm: number;
}

export interface TrackState {
    loopLengthTick: number;
    mute: boolean;
    volume: number;
}

export interface NoteBuilderConfig {
    type: string;
}

export interface GeneratorConfig {
    class: string;
    params: Record<string, any>;
}

export interface SoundFontGeneratorConfig extends GeneratorConfig {
    class: "sf";
    params: {
        filename: string;
        preset_index: number;
        is_drum: boolean;
    }
}
