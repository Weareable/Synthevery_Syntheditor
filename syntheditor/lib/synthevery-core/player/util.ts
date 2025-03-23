import { TickClockState, TrackState } from "@/lib/synthevery-core/types/player";
import { deserializeFloat32, serializeFloat32, deserializeBoolean, serializeBoolean, deserializeUint32, serializeUint32 } from "../appstate/appstates";

export function deserializeTickClockState(data: Uint8Array): TickClockState | null {
    if (data.length < 9) {
        return null;
    }
    const playing = data[0] === 1;
    const bpm = deserializeFloat32(data.slice(1, 5));
    if (bpm === null) {
        return null;
    }
    return { playing, bpm };
}

export function serializeTickClockState(state: TickClockState): Uint8Array {
    const data = new Uint8Array(9);
    data[0] = state.playing ? 1 : 0;
    data.set(serializeFloat32(state.bpm), 1);
    return data;
}

export function deserializeTrackState(data: Uint8Array): TrackState | null {
    if (data.length < 6) {
        return null;
    }
    const loopLengthTick = deserializeUint32(data.slice(0, 4));
    const mute = deserializeBoolean(data.slice(4, 5));
    const volume = deserializeFloat32(data.slice(5, 6));
    if (loopLengthTick === null || mute === null || volume === null) {
        return null;
    }
    return { loopLengthTick, mute, volume };
}

export function serializeTrackState(state: TrackState): Uint8Array {
    const data = new Uint8Array(6);
    const loopLengthTickData = serializeUint32(state.loopLengthTick);
    const muteData = serializeBoolean(state.mute);
    const volumeData = serializeFloat32(state.volume);

    data.set(loopLengthTickData, 0);
    data.set(muteData, 4);
    data.set(volumeData, 5);
    return data;
}
