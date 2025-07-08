import { useState, useEffect, useCallback } from "react";
import { mesh } from "@/lib/synthevery-core/connection/mesh";
import { getAddressFromString, getAddressString } from "@/lib/synthevery-core/connection/util";
import { P2PMacAddress } from "@/lib/synthevery-core/types/mesh";

export default function useMesh() {
    const [connectedDevices, setConnectedDevices] = useState<string[]>(() =>
        mesh.getConnectedDevices().map((device) => getAddressString(device))
    );
    const [connectedPeers, setConnectedPeers] = useState<string[]>(() =>
        mesh.getConnectedPeers().map((device) => getAddressString(device))
    );

    useEffect(() => {
        const handleConnectedDevicesChanged = (devices: P2PMacAddress[]) => {
            setConnectedDevices(devices.map((device) => getAddressString(device)));
        };
        mesh.eventEmitter.on("connectedDevicesChanged", handleConnectedDevicesChanged);

        return () => {
            mesh.eventEmitter.off("connectedDevicesChanged", handleConnectedDevicesChanged);
        };
    }, []);

    useEffect(() => {
        const handlePeerConnected = (address: P2PMacAddress) => {
            setConnectedPeers(mesh.getConnectedPeers().map((device) => getAddressString(device)));
        };
        mesh.eventEmitter.on("peerConnected", handlePeerConnected);

        return () => {
            mesh.eventEmitter.off("peerConnected", handlePeerConnected);
        };
    }, []);

    useEffect(() => {
        const handlePeerDisconnected = (address: P2PMacAddress) => {
            setConnectedPeers(mesh.getConnectedPeers().map((device) => getAddressString(device)));
        };
        mesh.eventEmitter.on("peerDisconnected", handlePeerDisconnected);

        return () => {
            mesh.eventEmitter.off("peerDisconnected", handlePeerDisconnected);
        };
    }, []);

    const connectDevice = useCallback(async () => {
        await mesh.connectDevice();
    }, []);

    const disconnectDevice = useCallback(async (address: string) => {
        await mesh.disconnectDevice(getAddressFromString(address));
    }, []);

    return {
        connectedDevices,
        connectedPeers,
        connectDevice,
        disconnectDevice,
    };
}