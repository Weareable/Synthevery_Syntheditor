import { useState, useEffect, useCallback } from 'react';
import { useSynthevery } from '@/contexts/SyntheveryContext';
import { P2PMacAddress } from '@/lib/synthevery-core/types/mesh';
import { getAddressString } from '@/lib/synthevery-core/connection/util';

export interface UseDeviceOrderReturn {
    /**
     * デバイス接続順序のリスト
     */
    deviceOrder: P2PMacAddress[];

    /**
     * 指定デバイスのアルファベットIDを取得
     */
    getDeviceAlphabetId: (deviceAddr: P2PMacAddress) => string;

    /**
     * 指定デバイスの接続順序インデックスを取得
     */
    getDeviceIndex: (deviceAddr: P2PMacAddress) => number;

    /**
     * デバイス順序データの準備状態
     */
    isOrderReady: boolean;
}

/**
 * デバイス接続順序管理のカスタムフック
 * 
 * mesh.getDeviceOrder()からデバイスの接続順序を取得し、
 * アルファベットID（A, B, C...）の生成機能を提供します。
 */
export function useDeviceOrder(): UseDeviceOrderReturn {
    const { mesh } = useSynthevery();
    const [deviceOrder, setDeviceOrder] = useState<P2PMacAddress[]>([]);
    const [isOrderReady, setIsOrderReady] = useState(false);

    // デバイス順序の更新
    const updateDeviceOrder = useCallback(() => {
        try {
            if (mesh && typeof mesh.getDeviceOrder === 'function') {
                // 接続されたデバイスを取得
                const connectedDevices = mesh.getConnectedDevices();

                // 各デバイスの deviceOrder を収集
                const allDeviceOrders: P2PMacAddress[] = [];

                connectedDevices.forEach(deviceAddr => {
                    const meshDevice = mesh.meshDevices.get(getAddressString(deviceAddr));
                    if (meshDevice && meshDevice.deviceOrder) {
                        // デバイスの deviceOrder を取得
                        meshDevice.deviceOrder.forEach(addr => {
                            // 重複を避けて追加
                            if (!allDeviceOrders.some(existing =>
                                getAddressString(existing) === getAddressString(addr)
                            )) {
                                allDeviceOrders.push(addr);
                            }
                        });
                    }
                });

                // 接続されているデバイスのみをフィルタ
                const filteredOrder = allDeviceOrders.filter(addr =>
                    connectedDevices.some(connected =>
                        getAddressString(connected) === getAddressString(addr)
                    )
                );

                setDeviceOrder(filteredOrder);
                setIsOrderReady(true);

                console.log('DeviceOrder updated:', {
                    connectedDevices: connectedDevices.map(getAddressString),
                    deviceOrder: filteredOrder.map(getAddressString)
                });
            } else {
                console.warn('mesh.getDeviceOrder is not available');
                setIsOrderReady(false);
            }
        } catch (error) {
            console.error('Failed to update device order:', error);
            setDeviceOrder([]);
            setIsOrderReady(false);
        }
    }, [mesh]);

    // 初期化とイベント監視
    useEffect(() => {
        if (!mesh) {
            setIsOrderReady(false);
            return;
        }

        // 初期データの取得
        updateDeviceOrder();

        // メッシュイベントの監視
        const handleDeviceConnected = () => {
            console.log('Device connected - updating order');
            setTimeout(updateDeviceOrder, 100); // 少し遅延させて確実にデータを取得
        };

        const handleDeviceDisconnected = () => {
            console.log('Device disconnected - updating order');
            setTimeout(updateDeviceOrder, 100);
        };

        const handleDeviceOrderChanged = () => {
            console.log('Device order changed - updating order');
            updateDeviceOrder();
        };

        // イベントリスナーの登録
        mesh.eventEmitter.on('peerConnected', handleDeviceConnected);
        mesh.eventEmitter.on('peerDisconnected', handleDeviceDisconnected);
        mesh.eventEmitter.on('connectedDevicesChanged', handleDeviceOrderChanged);

        return () => {
            // クリーンアップ
            mesh.eventEmitter.off('peerConnected', handleDeviceConnected);
            mesh.eventEmitter.off('peerDisconnected', handleDeviceDisconnected);
            mesh.eventEmitter.off('connectedDevicesChanged', handleDeviceOrderChanged);
        };
    }, [mesh, updateDeviceOrder]);

    // アルファベットID生成
    const getDeviceAlphabetId = useCallback((deviceAddr: P2PMacAddress): string => {
        const index = deviceOrder.findIndex(addr =>
            getAddressString(addr) === getAddressString(deviceAddr)
        );

        if (index >= 0 && index < 26) {
            return String.fromCharCode(65 + index); // A, B, C, D...
        }

        return '?'; // 見つからない場合または26個を超える場合
    }, [deviceOrder]);

    // インデックス取得
    const getDeviceIndex = useCallback((deviceAddr: P2PMacAddress): number => {
        return deviceOrder.findIndex(addr =>
            getAddressString(addr) === getAddressString(deviceAddr)
        );
    }, [deviceOrder]);

    return {
        deviceOrder,
        getDeviceAlphabetId,
        getDeviceIndex,
        isOrderReady
    };
}
