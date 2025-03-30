import { useState, useEffect, useCallback } from "react";
import { playerController } from "@/lib/synthevery-core/player/controller";
import { useReadOnlyAppState } from "./useAppState";
import { playerSyncStates } from "@/lib/synthevery-core/player/states";

export default function usePlayerControl() {
    const tickClockState = useReadOnlyAppState(playerSyncStates.tickClockState);

    const playingState = tickClockState.playing;
    const bpmState = tickClockState.bpm;

    const setPlayingState = useCallback((playing: boolean) => {
        playerController.setPlayingState(playing ? "play" : "pause");
    }, []);

    const setBpmState = useCallback((bpm: number) => {
        playerController.setBpm(bpm);
    }, []);

    const stop = useCallback(() => {
        playerController.setPlayingState("stop");
    }, []);

    return { playingState, bpmState, setPlayingState, setBpmState, stop };
}
