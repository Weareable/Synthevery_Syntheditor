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
} from '@/lib/synthevery/connection/constants';
import { useBLEContext } from '@/providers/ble-provider';

interface MeshContextValue {
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

    // --- Refs ---
    const callbacks = useRef<Map<number, (packet: MeshPacket) => void>>(new Map());
    const sendQueue = useRef<{ type: number; destination: P2PMacAddress; data: Uint8Array }[]>([]);
    const isSending = useRef(false);
    const packetIndex = useRef(0);

    const rxCharacteristic = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
    const txCharacteristic = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

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

        if (isSending.current || sendQueue.current.length === 0 || !txCharacteristic.current) return;

        isSending.current = true;
        const packetData = sendQueue.current.shift();
        let retryCount = 0;

        while (packetData && retryCount < 3 && isConnected) {
            try {
                const { type, destination, data } = packetData;
                const packet: MeshPacket = {
                    type,
                    source: { address: APP_MAC_ADDRESS },
                    destination,
                    data,
                    index: packetIndex.current,
                };
                packetIndex.current = (packetIndex.current + 1) % 256; // 0~255を循環
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
            console.log("initializeMesh");
            console.log("isConnected", isConnected);
            // Rxキャラクタリスティック設定
            rxCharacteristic.current = await getCharacteristic(MESH_SERVICE_UUID, MESH_PACKET_RX_CHAR_UUID);
            if (!rxCharacteristic.current) throw new Error('Rx characteristic not found');
            await rxCharacteristic.current.startNotifications();
            rxCharacteristic.current.removeEventListener('characteristicvaluechanged', handleNotify);
            rxCharacteristic.current.addEventListener('characteristicvaluechanged', handleNotify);

            console.log("isConnected", isConnected);
            // Txキャラクタリスティック設定
            txCharacteristic.current = await getCharacteristic(MESH_SERVICE_UUID, MESH_PACKET_TX_CHAR_UUID);
            if (!txCharacteristic.current) throw new Error('Tx characteristic not found');

            console.log("isConnected", isConnected);
            // MACアドレス読み取り
            const peerMacChar = await getCharacteristic(CONNECTION_INFO_SERVICE_UUID, MAC_ADDRESS_CHAR_UUID);
            if (!peerMacChar) throw new Error('MAC address characteristic not found');

            console.log("isConnected", isConnected);

            const peerMacValue = await peerMacChar.readValue();
            const peerMacAddress = new Uint8Array(peerMacValue.buffer);
            console.log('Connected device MAC address:', peerMacAddress);

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
            rxCharacteristic.current.removeEventListener('characteristicvaluechanged', handleNotify);
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
            setIsMeshReady(true);
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
    const handleNotify = (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        if (!target?.value) return;

        try {
            const packet = decodeMeshPacket(new Uint8Array(target.value.buffer));
            const callback = callbacks.current.get(packet.type);
            if (callback) {
                callback(packet);
            } else {
                console.warn(`No callback registered for type: ${packet.type}`);
            }
        } catch (err) {
            console.error('Error processing received packet:', err);
        }
    };

    const getAddress = useCallback(() => {
        return { address: APP_MAC_ADDRESS };
    }, []);

    // コンテキストに渡す値
    const value: MeshContextValue = {
        isMeshReady,
        setCallback,
        removeCallback,
        sendPacket,
        initializeMesh,
        getAddress,
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
