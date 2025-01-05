/// <reference types="web-bluetooth" />

'use client';

import React, {
    createContext,
    useContext,
    useRef,
    useCallback,
    useEffect,
    PropsWithChildren,
    useState,
} from 'react';
import {
    encodeMeshPacket,
    decodeMeshPacket,
    encodeNeighborListData,
    getAddressString,
} from '@/lib/synthevery/connection/mesh-node';
import {
    MeshPacket,
    NeighborListData,
    P2PMacAddress,
} from '@/types/mesh';
import {
    MESH_SERVICE_UUID,
    CONNECTION_INFO_SERVICE_UUID,
    MESH_PACKET_TX_CHAR_UUID,
    MESH_PACKET_RX_CHAR_UUID,
    MAC_ADDRESS_CHAR_UUID,
    APP_MAC_ADDRESS,
    MESH_PACKET_TYPE_NEIGHBOR_LIST,
    CONNECTED_DEVICES_CHAR_UUID,
} from '@/lib/synthevery/connection/constants';
import { useBLEContext } from '@/providers/ble-provider';

export interface MeshContextValue {
    isMeshReady: boolean;
    setCallback: (type: number, func: (packet: MeshPacket) => void) => void;
    removeCallback: (type: number) => void;
    sendPacket: (
        type: number,
        destination: P2PMacAddress,
        data: Uint8Array
    ) => Promise<void>;
    initializeMesh: () => Promise<void>;
    getAddress: () => P2PMacAddress;
    getPeerAddress: () => P2PMacAddress;
    connectedDevices: P2PMacAddress[];
}

const MeshContext = createContext<MeshContextValue | null>(null);

export function MeshProvider({ children }: PropsWithChildren) {
    const {
        writeCharacteristic,
        getCharacteristic,
        isConnected,
        isConnecting,
    } = useBLEContext();

    const [isMeshReady, setIsMeshReady] = useState(false);
    const [connectedDevices, setConnectedDevices] = useState<P2PMacAddress[]>([{ address: APP_MAC_ADDRESS }]);

    // --- Refs ---
    const callbacks = useRef<Map<number, (packet: MeshPacket) => void>>(new Map());
    const sendQueue = useRef<{ type: number; destination: P2PMacAddress; data: Uint8Array }[]>([]);
    const isSending = useRef(false);
    const packetIndex = useRef(new Map<string, number>());

    const rxCharacteristic = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
    const txCharacteristic = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

    const peerAddress = useRef<P2PMacAddress | null>(null);

    // setIntervalのIDを管理するRef
    const neighborListIntervalId = useRef<NodeJS.Timeout | null>(null);

    // --- Callbacks ---

    const setCallback = useCallback((type: number, func: (packet: MeshPacket) => void) => {
        callbacks.current.set(type, func);
    }, []);

    const removeCallback = useCallback((type: number) => {
        callbacks.current.delete(type);
    }, []);

    /**
     * パケット送信キューに追加し、まだ送信中でなければ順番に送信を開始
     */
    const sendPacket =
        async (type: number, destination: P2PMacAddress, data: Uint8Array): Promise<void> => {
            sendQueue.current.push({ type, destination, data });
            if (!isSending.current) {
                processQueue();
            }
        };

    /**
     * キューにあるパケットを順次送信
     */
    const processQueue = async () => {
        console.log('processQueue');
        console.log(sendQueue.current);
        console.log(isConnected ? 'connected' : 'disconnected');

        if (isSending.current || sendQueue.current.length === 0 || !txCharacteristic.current) {
            console.warn("processQueue() : cannot send packet!");
            return;
        }

        isSending.current = true;
        const packetData = sendQueue.current.shift();
        let retryCount = 0;

        while (packetData && retryCount < 3) {
            try {
                const { type, destination, data } = packetData;

                let currentIndex = packetIndex.current.get(getAddressString(destination));
                if (!currentIndex) {
                    currentIndex = 0;
                }

                const packet: MeshPacket = {
                    type,
                    source: { address: APP_MAC_ADDRESS },
                    destination,
                    data,
                    index: currentIndex,
                };

                packetIndex.current.set(getAddressString(destination), (currentIndex + 1) % 256); // 0~255を循環
                const encodedPacket = encodeMeshPacket(packet);

                console.log("write characteristic");

                await writeCharacteristic(MESH_SERVICE_UUID, MESH_PACKET_TX_CHAR_UUID, encodedPacket);
                retryCount = 3; // 成功したらループ脱出
            } catch (err) {
                console.error('Error sending packet:', err);
                retryCount++;
                if (retryCount >= 3) {
                    console.error('Max retry attempts reached for packet:', packetData);
                }
            }
        }
        isSending.current = false;

        // まだキューが残っていれば再度送信処理
        if (sendQueue.current.length > 0) {
            processQueue();
        }
    };

    /**
     * Meshネットワークを初期化
     */
    const initializeMesh = useCallback(async (): Promise<void> => {
        try {
            // Rxキャラクタリスティック設定
            rxCharacteristic.current = await getCharacteristic(MESH_SERVICE_UUID, MESH_PACKET_RX_CHAR_UUID);
            if (!rxCharacteristic.current) throw new Error('Rx characteristic not found');
            await rxCharacteristic.current.startNotifications();
            rxCharacteristic.current.removeEventListener('characteristicvaluechanged', handleNotifyRx);
            rxCharacteristic.current.addEventListener('characteristicvaluechanged', handleNotifyRx);

            // Txキャラクタリスティック設定
            txCharacteristic.current = await getCharacteristic(MESH_SERVICE_UUID, MESH_PACKET_TX_CHAR_UUID);
            if (!txCharacteristic.current) throw new Error('Tx characteristic not found');

            // MACアドレス読み取り
            const peerMacChar = await getCharacteristic(CONNECTION_INFO_SERVICE_UUID, MAC_ADDRESS_CHAR_UUID);
            if (!peerMacChar) throw new Error('MAC address characteristic not found');

            const peerMacValue = await peerMacChar.readValue();
            const peerMacAddress = new Uint8Array(peerMacValue.buffer);
            console.log('Connected device MAC address:', peerMacAddress);

            peerAddress.current = { address: peerMacAddress };

            // ConnectedDevicesの読み取り
            const connectedDevicesChar = await getCharacteristic(CONNECTION_INFO_SERVICE_UUID, CONNECTED_DEVICES_CHAR_UUID);
            if (!connectedDevicesChar) throw new Error('Connected devices characteristic not found');

            const connectedDevicesValue = await connectedDevicesChar.readValue();
            const connectedDevices = decodeConnectedDevices(new Uint8Array(connectedDevicesValue.buffer));
            console.log('Connected devices:', connectedDevices);
            setConnectedDevices(connectedDevices);

            // 定期的にConnectedDevicesを読み取る
            connectedDevicesChar.removeEventListener('characteristicvaluechanged', handleNotifyConnectedDevices);
            connectedDevicesChar.addEventListener('characteristicvaluechanged', handleNotifyConnectedDevices);

            // 定期的にNeighborListDataを送信するintervalを開始
            neighborListIntervalId.current = setInterval(() => {
                const neighborList: NeighborListData = {
                    sender: { address: APP_MAC_ADDRESS },
                    neighbor_addresses: [{ address: peerMacAddress }],
                    sent_addresses: [{ address: APP_MAC_ADDRESS }],
                };

                console.log('send NeighborListData');

                sendPacket(
                    MESH_PACKET_TYPE_NEIGHBOR_LIST,
                    { address: peerMacAddress },
                    encodeNeighborListData(neighborList)
                ).catch((err) => console.error('Error sending NeighborListData:', err));
            }, 1000);

            setIsMeshReady(true);
        } catch (err) {
            console.error('Error initializing Mesh:', err);
        }
    }, [getCharacteristic, isConnected]);

    /**
     * Meshネットワークのクリーンアップ
     */
    const cleanupMesh = useCallback(() => {
        // Interval停止
        if (neighborListIntervalId.current) {
            clearInterval(neighborListIntervalId.current);
            neighborListIntervalId.current = null;
        }

        // characteristicvaluechangedイベント解除
        if (rxCharacteristic.current) {
            rxCharacteristic.current.removeEventListener('characteristicvaluechanged', handleNotifyRx);
        }

        // キャラクタリスティックの参照をクリア
        rxCharacteristic.current = null;
        txCharacteristic.current = null;

        // キューなどの状態をリセットしたい場合はここで処理
        sendQueue.current = [];
        isSending.current = false;

        console.log('Mesh cleanup complete.');
    }, []);

    /**
     * BLE接続状態が変化したら、接続時にinitialize、切断時にcleanup
     */
    useEffect(() => {
        console.log("useEffect : ", isConnected, isConnecting);
        if (isConnected && !isConnecting) {
            // 接続成功 → Mesh開始
            console.log('BLE connected, initialize Mesh', isConnected, isConnecting);
            initializeMesh();
        } else {
            // 切断 → Meshクリーンアップ
            console.log('BLE disconnected, cleanup Mesh');
            setIsMeshReady(false);
            cleanupMesh();
        }
        // アンマウント時もクリーンアップ
        return () => {
            console.log('MeshProvider unmount, cleanup Mesh');
            setIsMeshReady(false);
            cleanupMesh();
        };
    }, [isConnected, isConnecting, initializeMesh, cleanupMesh]);

    /**
     * Notifyイベントを受信したときの処理
     */
    const handleNotifyRx = (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        if (!target?.value) return;

        try {
            const packet = decodeMeshPacket(new Uint8Array(target.value.buffer));
            const callback = callbacks.current.get(packet.type);
            if (callback) {
                console.log("handleNotifyRx(): type=", packet.type, "from=", getAddressString(packet.source), "to=", getAddressString(packet.destination), "data=", packet.data);
                callback(packet);
            } else {
                console.warn(`No callback registered for type: ${packet.type}`);
            }
        } catch (err) {
            console.error('Error processing received packet:', err);
        }
    };

    const decodeConnectedDevices = (data: Uint8Array) => {
        // 6バイトずつ分割
        const macAddresses = [];
        for (let i = 0; i < data.length; i += 6) {
            const macAddress = data.slice(i, i + 6);
            macAddresses.push({ address: macAddress });
        }
        return macAddresses;
    };

    const handleNotifyConnectedDevices = (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        if (!target?.value) return;

        const macAddresses = decodeConnectedDevices(new Uint8Array(target.value.buffer));
        console.log('handleNotifyConnectedDevices');
        console.log(macAddresses);
        setConnectedDevices(macAddresses);
    };


    const getAddress = useCallback(() => {
        return { address: APP_MAC_ADDRESS };
    }, []);

    const getPeerAddress = useCallback(() => {
        if (!peerAddress.current) {
            throw new Error('Peer not initialized');
        }
        return peerAddress.current;
    }, [peerAddress]);

    // コンテキストに渡す値
    const value: MeshContextValue = {
        isMeshReady,
        setCallback,
        removeCallback,
        sendPacket,
        initializeMesh,
        getAddress,
        getPeerAddress,
        connectedDevices,
    };

    return (
        <MeshContext.Provider value={value}>
            {children}
        </MeshContext.Provider>
    );
}

/**
 * Meshコンテキストを取得するためのフック
 */
export function useMeshContext() {
    const context = useContext(MeshContext);
    if (!context) {
        throw new Error('useMeshContext must be used within MeshProvider');
    }
    return context;
}
