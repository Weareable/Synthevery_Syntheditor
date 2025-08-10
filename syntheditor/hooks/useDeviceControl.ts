import { useState, useEffect, useCallback } from "react";
import { deviceController } from "@/lib/synthevery-core/device/controller";
import { useReadOnlyAppState } from "./useAppState";
import { playerSyncStates } from "@/lib/synthevery-core/player/states";

export default function useDeviceControl() {
    const tickClockState = useReadOnlyAppState(playerSyncStates.tickClockState);

    const playingState = tickClockState.playing;
    const bpmState = tickClockState.bpm;

    const setPlayingState = useCallback((playing: boolean) => {
        deviceController.setPlayingState(playing ? "play" : "pause");
    }, []);

    const setBpmState = useCallback((bpm: number) => {
        deviceController.setBpm(bpm);
    }, []);

    const stop = useCallback(() => {
        deviceController.setPlayingState("stop");
    }, []);

    return { playingState, bpmState, setPlayingState, setBpmState, stop };
}
