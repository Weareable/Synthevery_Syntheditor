import { useState, useEffect, useCallback } from "react";
import { useSynthevery } from "@/contexts/SyntheveryContext";
import { getAddressFromString, getAddressString } from "@/lib/synthevery-core/connection/util";
import { P2PMacAddress } from "@/lib/synthevery-core/types/mesh";

export default function useMesh() {
    const { mesh } = useSynthevery();
    const [connectedDevices, setConnectedDevices] = useState<string[]>(() => {
        const devices = mesh.getConnectedDevices().map((device) => getAddressString(device));
        console.log('=== useMesh: Initial connectedDevices ===');
        console.log('Devices:', devices);
        return devices;
    });
    const [connectedPeers, setConnectedPeers] = useState<string[]>(() => {
        const peers = mesh.getConnectedPeers().map((device) => getAddressString(device));
        console.log('=== useMesh: Initial connectedPeers ===');
        console.log('Peers:', peers);
        return peers;
    });
    // デバイス順序とリーダーMACアドレス
    const [deviceOrder, setDeviceOrder] = useState<string[]>(() =>
        mesh.getDeviceOrder().map((device) => getAddressString(device))
    );
    const [leaderMacAddress, setLeaderMacAddress] = useState<string | null>(() => {
        const leader = mesh.getLeaderMacAddress();
        return leader ? getAddressString(leader) : null;
    });

    // 準備状態の管理
    const [isReady, setIsReady] = useState(() => {
        // 初期状態でデバイス順序が設定されている場合は準備完了
        const initialDeviceOrder = mesh.getDeviceOrder();
        return initialDeviceOrder.length > 0;
    });

    // デバイス順序の更新関数
    const updateDeviceOrder = useCallback(() => {
        try {
            const newDeviceOrder = mesh.getDeviceOrder().map((device) => getAddressString(device));
            console.log('=== useMesh: Updating Device Order ===');
            console.log('Current device order:', deviceOrder);
            console.log('New device order:', newDeviceOrder);

            if (JSON.stringify(newDeviceOrder) !== JSON.stringify(deviceOrder)) {
                setDeviceOrder(newDeviceOrder);
                setIsReady(newDeviceOrder.length > 0);
                console.log('Device order updated, isReady:', newDeviceOrder.length > 0);
            }
        } catch (error) {
            console.error('Failed to update device order:', error);
        }
    }, [deviceOrder, mesh]);

    // 接続デバイス変更の監視
    useEffect(() => {
        const handleConnectedDevicesChanged = (devices: P2PMacAddress[], added: P2PMacAddress[], removed: P2PMacAddress[]) => {
            console.log('=== useMesh: Connected Devices Changed ===');
            console.log('Devices:', devices.map(getAddressString));
            console.log('Added:', added.map(getAddressString));
            console.log('Removed:', removed.map(getAddressString));
            console.log('Current meshDevices count:', mesh.meshDevices.size);
            console.log('Current meshDevices keys:', Array.from(mesh.meshDevices.keys()));

            setConnectedDevices(devices.map((device) => getAddressString(device)));

            // デバイス順序も更新
            setTimeout(updateDeviceOrder, 100);
        };

        mesh.eventEmitter.on("connectedDevicesChanged", handleConnectedDevicesChanged);
        return () => {
            mesh.eventEmitter.off("connectedDevicesChanged", handleConnectedDevicesChanged);
        };
    }, [mesh, updateDeviceOrder]);

    // ピア接続/切断の監視
    useEffect(() => {
        const handlePeerConnected = (address: P2PMacAddress) => {
            console.log('=== useMesh: Peer Connected ===');
            console.log('Address:', getAddressString(address));

            setConnectedPeers(mesh.getConnectedPeers().map((device) => getAddressString(device)));
            // デバイス順序も更新
            setTimeout(updateDeviceOrder, 100);
        };

        const handlePeerDisconnected = (address: P2PMacAddress) => {
            console.log('=== useMesh: Peer Disconnected ===');
            console.log('Address:', getAddressString(address));

            setConnectedPeers(mesh.getConnectedPeers().map((device) => getAddressString(device)));
            // デバイス順序も更新
            setTimeout(updateDeviceOrder, 100);
        };

        mesh.eventEmitter.on("peerConnected", handlePeerConnected);
        mesh.eventEmitter.on("peerDisconnected", handlePeerDisconnected);

        return () => {
            mesh.eventEmitter.off("peerConnected", handlePeerConnected);
            mesh.eventEmitter.off("peerDisconnected", handlePeerDisconnected);
        };
    }, [mesh, updateDeviceOrder]);

    // デバイス順序変更の監視（既存のイベント）
    useEffect(() => {
        const handleDeviceOrderChanged = (deviceOrder: P2PMacAddress[]) => {
            console.log('=== useMesh: Device Order Changed Event ===');
            console.log('New device order:', deviceOrder.map(getAddressString));
            setDeviceOrder(deviceOrder.map((device) => getAddressString(device)));
            setIsReady(deviceOrder.length > 0);
        };

        mesh.eventEmitter.on("deviceOrderChanged", handleDeviceOrderChanged);
        return () => {
            mesh.eventEmitter.off("deviceOrderChanged", handleDeviceOrderChanged);
        };
    }, [mesh]);

    // リーダーMACアドレス変更の監視
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
    }, [mesh]);

    // 定期的なデバイス順序の更新（フォールバック）
    useEffect(() => {
        const interval = setInterval(() => {
            if (!isReady) {
                console.log('=== useMesh: Periodic update check ===');
                updateDeviceOrder();
            }
        }, 1000); // 1秒ごとにチェック

        return () => clearInterval(interval);
    }, [isReady, updateDeviceOrder]);

    const connectDevice = useCallback(async () => {
        await mesh.connectDevice();
    }, [mesh]);

    const disconnectDevice = useCallback(async (address: string) => {
        await mesh.disconnectDevice(getAddressFromString(address));
    }, [mesh]);

    return {
        connectedDevices,
        connectedPeers,
        deviceOrder,
        leaderMacAddress,
        isReady,
        connectDevice,
        disconnectDevice,
    };
}