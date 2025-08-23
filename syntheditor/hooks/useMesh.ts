import { useState, useEffect, useCallback } from "react";
import { useSynthevery } from "@/contexts/SyntheveryContext";
import { getAddressFromString, getAddressString } from "@/lib/synthevery-core/connection/util";
import { P2PMacAddress } from "@/lib/synthevery-core/types/mesh";

export default function useMesh() {
    const { mesh } = useSynthevery();
    const [connectedDevices, setConnectedDevices] = useState<string[]>(() =>
        mesh.getConnectedDevices().map((device) => getAddressString(device))
    );
    const [connectedPeers, setConnectedPeers] = useState<string[]>(() =>
        mesh.getConnectedPeers().map((device) => getAddressString(device))
    );
    // 新規追加: デバイス順序とリーダーMACアドレス
    const [deviceOrder, setDeviceOrder] = useState<string[]>(() =>
        mesh.getDeviceOrder().map((device) => getAddressString(device))
    );
    const [leaderMacAddress, setLeaderMacAddress] = useState<string | null>(() => {
        const leader = mesh.getLeaderMacAddress();
        return leader ? getAddressString(leader) : null;
    });

    useEffect(() => {
        const handleConnectedDevicesChanged = (devices: P2PMacAddress[], added: P2PMacAddress[], removed: P2PMacAddress[]) => {
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

    // 新規追加: デバイス順序変更の監視
    useEffect(() => {
        const handleDeviceOrderChanged = (deviceOrder: P2PMacAddress[]) => {
            console.log('=== useMesh: Device Order Changed ===');
            console.log('New device order:', deviceOrder.map(getAddressString));
            setDeviceOrder(deviceOrder.map((device) => getAddressString(device)));
        };
        mesh.eventEmitter.on("deviceOrderChanged", handleDeviceOrderChanged);

        return () => {
            mesh.eventEmitter.off("deviceOrderChanged", handleDeviceOrderChanged);
        };
    }, []);

    // 新規追加: リーダーMACアドレス変更の監視
    useEffect(() => {
        const handleLeaderMacAddressChanged = (leader: P2PMacAddress | null) => {
            console.log('=== useMesh: Leader MAC Address Changed ===');
            console.log('New leader:', leader ? getAddressString(leader) : 'null');
            setLeaderMacAddress(leader ? getAddressString(leader) : null);
        };
        mesh.eventEmitter.on("leaderMacAddressChanged", handleLeaderMacAddressChanged);

        return () => {
            mesh.eventEmitter.off("leaderMacAddressChanged", handleLeaderMacAddressChanged);
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
        deviceOrder,        // 新規追加
        leaderMacAddress,   // 新規追加
        connectDevice,
        disconnectDevice,
    };
}