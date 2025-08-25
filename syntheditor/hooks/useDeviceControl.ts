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

    return { setPlayingState, setBpmState, stop };
}
