import { useState, useEffect, useCallback } from "react";
import { useSynthevery } from "@/contexts/SyntheveryContext";
import { useReadOnlyAppState } from "./useAppState";

export default function useDeviceControl() {
    const { deviceController, playerSyncStates } = useSynthevery();
    const tickClockState = useReadOnlyAppState(playerSyncStates.tickClockState);

    const playingState = tickClockState.playing;
    const bpmState = tickClockState.bpm;

    const setPlayingState = useCallback((playing: boolean) => {
        deviceController.setPlayingState(playing ? "play" : "pause");
    }, []); // オブジェクトが不変なので空でOK！

    const setBpmState = useCallback((bpm: number) => {
        deviceController.setBpm(bpm);
    }, []); // オブジェクトが不変なので空でOK！

    const stop = useCallback(() => {
        deviceController.setPlayingState("stop");
    }, []); // オブジェクトが不変なので空でOK！

    return { playingState, bpmState, setPlayingState, setBpmState, stop };
}
