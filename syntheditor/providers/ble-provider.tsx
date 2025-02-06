/// <reference types="web-bluetooth" />

'use client';

import React, {
    createContext,
    useContext,
    useRef,
    useState,
    PropsWithChildren,
    useCallback,
} from 'react';

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
        data: BufferSource
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

    getPrimaryService: (
        serviceUuid: string
    ) => Promise<BluetoothRemoteGATTService | null>;

    getCharacteristic: (
        serviceUuid: string,
        characteristicUuid: string
    ) => Promise<BluetoothRemoteGATTCharacteristic | null>;
}

const BLEContext = createContext<BLEContextValue | null>(null);

export function BLEProvider({ children }: PropsWithChildren) {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deviceRef = useRef<BluetoothDevice | null>(null);
    const serverRef = useRef<BluetoothRemoteGATTServer | null>(null);

    /**
     * デバイス切断時のイベントハンドラ
     */
    const handleDisconnected = () => {
        deviceRef.current = null;
        serverRef.current = null;
        setIsConnected(false);
        console.log("handleDisconnected, server disconnect detected.");
    };

    /**
     * BLEデバイスへ接続する
     */
    const connect = async (options?: RequestDeviceOptions) => {
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
            console.log("connect() called, server connected.");
        } catch (err: any) {
            console.error(err);
            setError(err?.message || String(err));
            deviceRef.current = null;
            serverRef.current = null;
            setIsConnected(false);
            console.log("connect error occurred, server disconnected.");
        } finally {
            setIsConnecting(false);
        }
    };

    /**
     * BLEデバイスから切断する
     */
    const disconnect = async () => {
        try {
            if (serverRef.current?.connected) {
                serverRef.current.disconnect();
            }
            deviceRef.current = null;
            serverRef.current = null;
            setIsConnected(false);
            console.log("disconnect() called, server disconnected.");
        } catch (err: any) {
            console.error(err);
            setError(err?.message || String(err));
        }
    };

    /**
     * キャラクタリスティックを読み取る
     */
    const readCharacteristic = async (
        serviceUuid: string,
        characteristicUuid: string
    ): Promise<DataView> => {
        if (!serverRef.current?.connected) {
            throw new Error('Device is not connected');
        }
        const service = await serverRef.current.getPrimaryService(serviceUuid);
        const characteristic = await service.getCharacteristic(characteristicUuid);
        const value = await characteristic.readValue();
        return value;
    };

    /**
     * キャラクタリスティックに書き込む
     */
    const writeCharacteristic = async (
        serviceUuid: string,
        characteristicUuid: string,
        data: BufferSource
    ): Promise<void> => {
        if (!serverRef.current?.connected) {
            throw new Error('Device is not connected');
        }
        const service = await serverRef.current.getPrimaryService(serviceUuid);
        const characteristic = await service.getCharacteristic(characteristicUuid);

        console.log('writeCharacteristic: data length', data.byteLength);
        console.log('writeCharacteristic: data', data);

        if (data.byteLength < 230) {
            await characteristic.writeValue(data);
        } else {
            console.log('writeCharacteristic: data too long');
        }
    };

    /**
     * 通知を開始し、値の変更をリスナーで受け取る
     */
    const startNotify = async (
        serviceUuid: string,
        characteristicUuid: string,
        onChange: (value: DataView) => void
    ): Promise<void> => {
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
    };

    /**
     * 通知を停止する
     */
    const stopNotify = async (
        serviceUuid: string,
        characteristicUuid: string
    ) => {
        if (!serverRef.current?.connected) {
            throw new Error('Device is not connected');
        }
        const service = await serverRef.current.getPrimaryService(serviceUuid);
        const characteristic = await service.getCharacteristic(characteristicUuid);

        await characteristic.stopNotifications();
        // イベントリスナーを削除したい場合は、addEventListener時の参照を保持し、ここでremoveEventListenerを呼ぶ必要がある
    };

    /**
     * ヘルパー関数: サービスを取得
     */
    const getPrimaryService = async (
        serviceUuid: string
    ): Promise<BluetoothRemoteGATTService | null> => {
        try {
            const service = await serverRef.current?.getPrimaryService(serviceUuid);
            return service || null;
        } catch (err) {
            console.error(`Service ${serviceUuid} not found`, err);
            return null;
        }
    };

    /**
     * ヘルパー関数: キャラクタリスティックを取得
     */
    const getCharacteristic = async (
        serviceUuid: string,
        characteristicUuid: string
    ): Promise<BluetoothRemoteGATTCharacteristic | null> => {
        try {
            const service = await getPrimaryService(serviceUuid);
            if (!service) return null;
            const characteristic = await service.getCharacteristic(characteristicUuid);
            return characteristic;
        } catch (err) {
            console.error(`Characteristic ${characteristicUuid} not found in service ${serviceUuid}`, err);
            return null;
        }
    };

    /**
     * Contextに提供する値
     */
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
