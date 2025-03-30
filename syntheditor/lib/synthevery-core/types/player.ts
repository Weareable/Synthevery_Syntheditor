export interface TickClockState {
    playing: boolean;
    bpm: number;
}

export interface TrackState {
    loopLengthTick: number;
    mute: boolean;
    volume: number;
}
