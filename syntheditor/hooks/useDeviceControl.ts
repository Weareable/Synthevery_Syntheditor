import { useCallback } from "react";
import { useSynthevery } from "@/contexts/SyntheveryContext";

export default function useDeviceControl() {
    const { deviceController } = useSynthevery();

    const setPlayingState = useCallback((playing: boolean) => {
        deviceController.setPlayingState(playing ? "play" : "pause");
    }, []); // オブジェクトが不変なので空でOK！

    const setBpmState = useCallback((bpm: number) => {
        deviceController.setBpm(bpm);
    }, []); // オブジェクトが不変なので空でOK！

    const stop = useCallback(() => {
        deviceController.setPlayingState("stop");
    }, []); // オブジェクトが不変なので空でOK！

    return { setPlayingState, setBpmState, stop };
}
