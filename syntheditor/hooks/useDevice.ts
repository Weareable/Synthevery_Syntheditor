import { useState } from "react";
import { connectDevice } from "@/lib/synthevery/connection/bluetooth";

export function useDevice() {
    const [device, setDevice] = useState<BluetoothDevice | null>(null);
    const [server, setServer] = useState<BluetoothRemoteGATTServer | undefined>();

    const connect = async () => {
        const { device, server } = await connectDevice();
        setDevice(device);
        setServer(server);
    };

    return { device, server, connect };
}