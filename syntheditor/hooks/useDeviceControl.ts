import { useCallback } from "react";
import { useSynthevery } from "@/contexts/SyntheveryContext";

export default function useDeviceControl() {
    const { deviceController } = useSynthevery();

    const setPlayingState = useCallback((playing: boolean) => {
        deviceController.setPlayingState(playing ? "play" : "pause");
    }, [deviceController]);

    const setBpmState = useCallback((bpm: number) => {
        deviceController.setBpm(bpm);
    }, [deviceController]);

    const stop = useCallback(() => {
        deviceController.setPlayingState("stop");
    }, [deviceController]);

    const resetTrack = useCallback((trackIdOneBased: number) => {
        const index = trackIdOneBased - 1;
        deviceController.resetTrack(index);
    }, [deviceController]);

    return { setPlayingState, setBpmState, stop, resetTrack };
}
