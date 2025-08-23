import { useCallback, useState, useEffect } from 'react';
import { useSynthevery } from '@/contexts/SyntheveryContext';
import { P2PMacAddress } from '@/lib/synthevery-core/types/mesh';
import { getAddressString } from '@/lib/synthevery-core/connection/util';

export interface UseDeviceColorsReturn {
    /**
     * デバイス本体色を取得
     */
    getDeviceBodyColor: (deviceAddr: P2PMacAddress) => string;

    /**
     * デバイスLED色を取得
     */
    getDeviceLedColor: (deviceAddr: P2PMacAddress) => string;

    /**
     * デバイスLED状態を取得
     */
    getDeviceLedStatus: (deviceAddr: P2PMacAddress) => 'on' | 'off' | 'blink';
}

/**
 * デバイス色管理のカスタムフック
 * 
 * DeviceConfigManagerから直接色情報を取得し、
 * 色の変更をリアクティブに監視します。
 * フォールバック色は '#4B5563' (ダークグレー) を使用します。
 */
export function useDeviceColors(): UseDeviceColorsReturn {
    const { deviceConfigManager } = useSynthevery();

    // 色の変更を検知するための状態
    const [colorUpdateTrigger, setColorUpdateTrigger] = useState(0);

    // デフォルトのフォールバック色
    const DEFAULT_BODY_COLOR = '#4B5563'; // ダークグレー
    const DEFAULT_LED_COLOR = '#3B82F6';  // ブルー

    // DeviceConfigManagerの色変更イベントを監視
    useEffect(() => {
        if (!deviceConfigManager) return;

        const handleBodyColorChanged = () => {
            console.log('=== useDeviceColors: Body color changed ===');
            setColorUpdateTrigger(prev => prev + 1);
        };

        const handleLedColorChanged = () => {
            console.log('=== useDeviceColors: LED color changed ===');
            setColorUpdateTrigger(prev => prev + 1);
        };

        // イベントリスナーを登録
        deviceConfigManager.eventEmitter.on('bodyColorConfigReceived', handleBodyColorChanged);
        deviceConfigManager.eventEmitter.on('ledColorConfigReceived', handleLedColorChanged);

        return () => {
            // クリーンアップ
            deviceConfigManager.eventEmitter.off('bodyColorConfigReceived', handleBodyColorChanged);
            deviceConfigManager.eventEmitter.off('ledColorConfigReceived', handleLedColorChanged);
        };
    }, [deviceConfigManager]);

    // デバイス本体色を取得
    const getDeviceBodyColor = useCallback((deviceAddr: P2PMacAddress): string => {
        if (!deviceConfigManager) {
            return DEFAULT_BODY_COLOR;
        }

        const bodyColorConfig = deviceConfigManager.getBodyColorConfig(deviceAddr);
        if (bodyColorConfig?.body_color) {
            return bodyColorConfig.body_color;
        }

        return DEFAULT_BODY_COLOR;
    }, [deviceConfigManager, colorUpdateTrigger]); // colorUpdateTriggerを依存配列に追加

    // デバイスLED色を取得
    const getDeviceLedColor = useCallback((deviceAddr: P2PMacAddress): string => {
        if (!deviceConfigManager) {
            return DEFAULT_LED_COLOR;
        }

        const ledColorConfig = deviceConfigManager.getLedColorConfig(deviceAddr);
        if (ledColorConfig?.base_led_color) {
            return ledColorConfig.base_led_color;
        }

        // LED設定がない場合は本体色を使用
        const bodyColor = getDeviceBodyColor(deviceAddr);
        return bodyColor;
    }, [deviceConfigManager, getDeviceBodyColor, colorUpdateTrigger]); // colorUpdateTriggerを依存配列に追加

    // デバイスLED状態を取得
    const getDeviceLedStatus = useCallback((deviceAddr: P2PMacAddress): 'on' | 'off' | 'blink' => {
        // DeviceConfigManagerからLED状態を取得する実装は今後追加予定
        // 現時点では接続済みデバイスは点灯状態として扱う
        return 'on';
    }, []);

    return {
        getDeviceBodyColor,
        getDeviceLedColor,
        getDeviceLedStatus
    };
}
