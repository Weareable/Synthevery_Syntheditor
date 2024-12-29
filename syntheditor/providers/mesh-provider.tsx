/// <reference types="web-bluetooth" />

'use client';

import React, { createContext, useContext, useRef, useCallback, PropsWithChildren } from 'react';
import { encodeMeshPacket, decodeMeshPacket, encodeNeighborListData } from '@/lib/synthevery/connection/mesh-node';
import { MeshPacket, NeighborListData, P2PMacAddress } from '@/types/mesh';
import {
    MESH_SERVICE_UUID,
    CONNECTION_INFO_SERVICE_UUID,
    MESH_PACKET_TX_CHAR_UUID,
    MESH_PACKET_RX_CHAR_UUID,
    MAC_ADDRESS_CHAR_UUID,
    APP_MAC_ADDRESS,
} from '@/lib/synthevery/connection/constants';
import { useBLEContext } from '@/providers/ble-provider';

interface MeshContextValue {
    setCallback: (type: number, func: (packet: MeshPacket) => void) => void;
    removeCallback: (type: number) => void;
    sendPacket: (type: number, destination: P2PMacAddress, data: Uint8Array) => Promise<void>;
    initializeMesh: () => Promise<void>;
}

const MeshContext = createContext<MeshContextValue | null>(null);

export function MeshProvider({ children }: PropsWithChildren) {
    const { writeCharacteristic, getCharacteristic } = useBLEContext();
    const callbacks = useRef<Map<number, (packet: MeshPacket) => void>>(new Map());
    const sendQueue = useRef<{ type: number; destination: P2PMacAddress; data: Uint8Array }[]>([]);
    const isSending = useRef(false);
    const packetIndex = useRef(0);
    const rxCharacteristic = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
    const txCharacteristic = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

    const setCallback = useCallback((type: number, func: (packet: MeshPacket) => void) => {
        callbacks.current.set(type, func);
    }, []);

    const removeCallback = useCallback((type: number) => {
        callbacks.current.delete(type);
    }, []);

    const sendPacket = async (type: number, destination: P2PMacAddress, data: Uint8Array): Promise<void> => {
        sendQueue.current.push({ type, destination, data });
        if (!isSending.current) {
            processQueue();
        }
    };

    const processQueue = async () => {
        if (isSending.current || sendQueue.current.length === 0 || !txCharacteristic.current) return;

        isSending.current = true;
        const packetData = sendQueue.current.shift();
        let retryCount = 0;

        while (packetData && retryCount < 3) {
            try {
                const { type, destination, data } = packetData;
                const packet: MeshPacket = {
                    type,
                    source: { address: APP_MAC_ADDRESS },
                    destination,
                    data,
                    index: packetIndex.current,
                };
                packetIndex.current = (packetIndex.current + 1) % 256; // Ensure index cycles from 0 to 255
                const encodedPacket = encodeMeshPacket(packet);
                await writeCharacteristic(MESH_SERVICE_UUID, MESH_PACKET_TX_CHAR_UUID, encodedPacket);
                retryCount = 3; // Exit loop on success
            } catch (err) {
                console.error('Error sending packet:', err);
                retryCount++;
                if (retryCount >= 3) {
                    console.error('Max retry attempts reached for packet:', packetData);
                }
            }
        }
        isSending.current = false;

        if (sendQueue.current.length > 0) {
            processQueue();
        }
    };

    const initializeMesh = useCallback(async (): Promise<void> => {
        try {
            // Get and set the Rx characteristic using BLE provider
            rxCharacteristic.current = await getCharacteristic(MESH_SERVICE_UUID, MESH_PACKET_RX_CHAR_UUID);
            if (!rxCharacteristic.current) throw new Error('Rx characteristic not found');
            await rxCharacteristic.current.startNotifications();
            rxCharacteristic.current.addEventListener('characteristicvaluechanged', handleNotify);

            // Get the Tx characteristic using BLE provider
            txCharacteristic.current = await getCharacteristic(MESH_SERVICE_UUID, MESH_PACKET_TX_CHAR_UUID);
            if (!txCharacteristic.current) throw new Error('Tx characteristic not found');

            // Read MAC address using BLE provider
            const macChar = await getCharacteristic(CONNECTION_INFO_SERVICE_UUID, MAC_ADDRESS_CHAR_UUID);
            if (!macChar) throw new Error('MAC address characteristic not found');
            const macValue = await macChar.readValue();
            const macAddress = new Uint8Array(macValue.buffer);
            console.log('Connected device MAC address:', macAddress);

            // Start periodic NeighborListData sending
            setInterval(() => {
                const neighborList: NeighborListData = {
                    sender: { address: APP_MAC_ADDRESS },
                    neighbor_addresses: [],
                    sent_addresses: [],
                };
                sendPacket(1, { address: macAddress }, encodeNeighborListData(neighborList)).catch((err) =>
                    console.error('Error sending NeighborListData:', err)
                );
            }, 1000);
        } catch (err) {
            console.error('Error initializing Mesh:', err);
        }
    }, [getCharacteristic, sendPacket]);

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

    const value: MeshContextValue = {
        setCallback,
        removeCallback,
        sendPacket,
        initializeMesh,
    };

    return <MeshContext.Provider value={value}>{children}</MeshContext.Provider>;
}

export function useMeshContext() {
    const context = useContext(MeshContext);
    if (!context) {
        throw new Error('useMeshContext must be used within MeshProvider');
    }
    return context;
}
