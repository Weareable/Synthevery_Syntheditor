import { useState, useEffect, useCallback } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { useSynthevery } from '@/contexts/SyntheveryContext';
import { P2PMacAddress } from '@/lib/synthevery-core/types/mesh';
import { getAddressString } from '@/lib/synthevery-core/connection/util';

/**
 * デバイス装着位置の定義
 */
export enum DevicePosition {
    HANDHELD = 0,    // 手持ち（人体アイコンに非表示）
    LEFT_ARM = 1,    // 左腕
    RIGHT_ARM = 2,   // 右腕
    LEFT_LEG = 3,    // 左足
    RIGHT_LEG = 4    // 右足
}

/**
 * 装着位置ラベルのマッピング
 */
export const POSITION_LABELS: Record<DevicePosition, string> = {
    [DevicePosition.HANDHELD]: '手持ち',
    [DevicePosition.LEFT_ARM]: '左腕',
    [DevicePosition.RIGHT_ARM]: '右腕',
    [DevicePosition.LEFT_LEG]: '左足',
    [DevicePosition.RIGHT_LEG]: '右足'
};

/**
 * 装着可能デバイス情報
 */
export interface WearableDevice {
    address: P2PMacAddress;
    position: DevicePosition;
}

export interface UseDevicePositionsReturn {
    /**
     * デバイス装着位置のマップ
     */
    devicePositions: Map<string, number>;

    /**
     * 指定デバイスの装着位置を取得
     */
    getDevicePosition: (deviceAddr: P2PMacAddress) => DevicePosition;

    /**
     * 装着位置のラベルを取得
     */
    getPositionLabel: (position: DevicePosition) => string;

    /**
     * 装着可能デバイス（手持ち以外）のリストを取得
     */
    getWearableDevices: () => WearableDevice[];

    /**
     * デバイス装着位置を更新
     */
    updateDevicePosition: (deviceAddr: P2PMacAddress, position: DevicePosition) => void;

    /**
     * 装着位置データの準備状態
     */
    isPositionsReady: boolean;
}

/**
 * デバイス装着位置管理のカスタムフック
 * 
 * playerSyncStates.devicePositionsとの連携で、
 * デバイスの装着位置を管理し、人体アイコン表示用のデータを提供します。
 */
export function useDevicePositions(): UseDevicePositionsReturn {
    const { playerSyncStates } = useSynthevery();
    const [devicePositions, updateDevicePositions] = useAppState(playerSyncStates.devicePositions);
    const [isPositionsReady, setIsPositionsReady] = useState(false);

    // 初期化
    useEffect(() => {
        setIsPositionsReady(true);
    }, []);

    // 指定デバイスの装着位置を取得
    const getDevicePosition = useCallback((deviceAddr: P2PMacAddress): DevicePosition => {
        const deviceKey = getAddressString(deviceAddr);
        const position = devicePositions.get(deviceKey);

        // 位置が設定されていない場合は手持ちをデフォルトとする
        if (position === undefined || position === null) {
            return DevicePosition.HANDHELD;
        }

        // 有効な範囲内かチェック
        if (position >= 0 && position <= 4) {
            return position as DevicePosition;
        }

        return DevicePosition.HANDHELD;
    }, [devicePositions]);

    // 装着位置のラベルを取得
    const getPositionLabel = useCallback((position: DevicePosition): string => {
        return POSITION_LABELS[position] || '不明';
    }, []);

    // 装着可能デバイス（手持ち以外）のリストを取得
    const getWearableDevices = useCallback((): WearableDevice[] => {
        const wearableDevices: WearableDevice[] = [];

        devicePositions.forEach((position, deviceKey) => {
            // 手持ち以外のデバイスのみを対象とする
            if (position !== DevicePosition.HANDHELD) {
                try {
                    // deviceKeyからP2PMacAddressを復元
                    const addressBytes = deviceKey.split(':').map(hex => parseInt(hex, 16));
                    if (addressBytes.length === 6) {
                        const address: P2PMacAddress = {
                            address: new Uint8Array(addressBytes)
                        };

                        wearableDevices.push({
                            address,
                            position: position as DevicePosition
                        });
                    }
                } catch (error) {
                    console.warn('Failed to parse device address:', deviceKey, error);
                }
            }
        });

        return wearableDevices;
    }, [devicePositions]);

    // デバイス装着位置を更新
    const updateDevicePosition = useCallback((deviceAddr: P2PMacAddress, position: DevicePosition) => {
        const deviceKey = getAddressString(deviceAddr);
        const newPositions = new Map(devicePositions);
        newPositions.set(deviceKey, position);
        updateDevicePositions(newPositions);

        console.log('Device position updated:', {
            device: deviceKey,
            position: position,
            label: getPositionLabel(position)
        });
    }, [devicePositions, updateDevicePositions, getPositionLabel]);

    return {
        devicePositions,
        getDevicePosition,
        getPositionLabel,
        getWearableDevices,
        updateDevicePosition,
        isPositionsReady
    };
}
