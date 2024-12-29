/// <reference types="web-bluetooth" />

'use client';

import React, { createContext, useContext, useRef, useState, useEffect, PropsWithChildren } from 'react';

interface BLEContextValue {
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;

    connect: (options?: RequestDeviceOptions) => Promise<void>;
    disconnect: () => Promise<void>;

    readCharacteristic: (
        serviceUuid: string,
        characteristicUuid: string
    ) => Promise<DataView>;

    writeCharacteristic: (
        serviceUuid: string,
        characteristicUuid: string,
        data: ArrayBuffer
    ) => Promise<void>;

    startNotify: (
        serviceUuid: string,
        characteristicUuid: string,
        onChange: (value: DataView) => void
    ) => Promise<void>;

    stopNotify: (
        serviceUuid: string,
        characteristicUuid: string
    ) => Promise<void>;

    // ヘルパー関数を追加
    getPrimaryService: (serviceUuid: string) => Promise<BluetoothRemoteGATTService | null>;
    getCharacteristic: (serviceUuid: string, characteristicUuid: string) => Promise<BluetoothRemoteGATTCharacteristic | null>;
}

const BLEContext = createContext<BLEContextValue | null>(null);

export function BLEProvider({ children }: PropsWithChildren) {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deviceRef = useRef<BluetoothDevice | null>(null);
    const serverRef = useRef<BluetoothRemoteGATTServer | null>(null);

    async function connect(options?: RequestDeviceOptions) {
        try {
            setIsConnecting(true);
            setError(null);

            const device = await navigator.bluetooth.requestDevice(options);
            deviceRef.current = device;

            const server = await device.gatt?.connect();
            if (!server) {
                throw new Error('Failed to connect GATT server');
            }
            serverRef.current = server;

            device.addEventListener('gattserverdisconnected', handleDisconnected);

            setIsConnected(true);
        } catch (err: any) {
            console.error(err);
            setError(err?.message || String(err));
            deviceRef.current = null;
            serverRef.current = null;
            setIsConnected(false);
        } finally {
            setIsConnecting(false);
        }
    }

    async function disconnect() {
        try {
            if (serverRef.current?.connected) {
                serverRef.current.disconnect();
            }
            deviceRef.current = null;
            serverRef.current = null;
            setIsConnected(false);
        } catch (err: any) {
            console.error(err);
            setError(err?.message || String(err));
        }
    }

    function handleDisconnected() {
        deviceRef.current = null;
        serverRef.current = null;
        setIsConnected(false);
    }

    async function readCharacteristic(
        serviceUuid: string,
        characteristicUuid: string
    ): Promise<DataView> {
        if (!serverRef.current?.connected) {
            throw new Error('Device is not connected');
        }
        const service = await serverRef.current.getPrimaryService(serviceUuid);
        const characteristic = await service.getCharacteristic(characteristicUuid);
        const value = await characteristic.readValue();
        return value;
    }

    async function writeCharacteristic(
        serviceUuid: string,
        characteristicUuid: string,
        data: ArrayBuffer
    ): Promise<void> {
        if (!serverRef.current?.connected) {
            throw new Error('Device is not connected');
        }
        const service = await serverRef.current.getPrimaryService(serviceUuid);
        const characteristic = await service.getCharacteristic(characteristicUuid);

        console.log('writeCharacteristic: data length', data.byteLength);
        console.log('writeCharacteristic: data', data);

        if (data.byteLength < 230) {
            const data_dummy = new Uint8Array(5);
            data_dummy[0] = 0x00;
            data_dummy[1] = 0x01;
            data_dummy[2] = 0x02;
            data_dummy[3] = 0x03;
            data_dummy[4] = 0x04;
            await characteristic.writeValue(data_dummy);
        } else {
            console.error('writeCharacteristic: data too long!');
        }

    }

    async function startNotify(
        serviceUuid: string,
        characteristicUuid: string,
        onChange: (value: DataView) => void
    ): Promise<void> {
        if (!serverRef.current?.connected) {
            throw new Error('Device is not connected');
        }
        const service = await serverRef.current.getPrimaryService(serviceUuid);
        const characteristic = await service.getCharacteristic(characteristicUuid);

        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
            const target = event.target as BluetoothRemoteGATTCharacteristic;
            if (target?.value) {
                onChange(target.value);
            }
        });
    }

    async function stopNotify(serviceUuid: string, characteristicUuid: string) {
        if (!serverRef.current?.connected) {
            throw new Error('Device is not connected');
        }
        const service = await serverRef.current.getPrimaryService(serviceUuid);
        const characteristic = await service.getCharacteristic(characteristicUuid);

        await characteristic.stopNotifications();
        // イベントリスナーの削除には、具体的な関数参照が必要です。
    }

    // ヘルパー関数の実装
    async function getPrimaryService(serviceUuid: string): Promise<BluetoothRemoteGATTService | null> {
        try {
            const service = await serverRef.current?.getPrimaryService(serviceUuid);
            return service || null;
        } catch (err) {
            console.error(`Service ${serviceUuid} not found`, err);
            return null;
        }
    }

    async function getCharacteristic(serviceUuid: string, characteristicUuid: string): Promise<BluetoothRemoteGATTCharacteristic | null> {
        try {
            const service = await getPrimaryService(serviceUuid);
            if (!service) return null;
            const characteristic = await service.getCharacteristic(characteristicUuid);
            return characteristic;
        } catch (err) {
            console.error(`Characteristic ${characteristicUuid} not found in service ${serviceUuid}`, err);
            return null;
        }
    }

    const value: BLEContextValue = {
        isConnected,
        isConnecting,
        error,

        connect,
        disconnect,
        readCharacteristic,
        writeCharacteristic,
        startNotify,
        stopNotify,

        // ヘルパー関数を提供
        getPrimaryService,
        getCharacteristic,
    };

    return (
        <BLEContext.Provider value={value}>
            {children}
        </BLEContext.Provider>
    );
}

export function useBLEContext() {
    const ctx = useContext(BLEContext);
    if (!ctx) {
        throw new Error('useBLEContext must be used within BLEProvider');
    }
    return ctx;
}
