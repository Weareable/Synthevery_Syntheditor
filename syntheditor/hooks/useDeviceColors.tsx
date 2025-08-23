import { useCallback } from 'react';
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
 * DeviceConfigManagerから直接色情報を取得します。
 * フォールバック色は '#4B5563' (ダークグレー) を使用します。
 */
export function useDeviceColors(): UseDeviceColorsReturn {
    const { deviceConfigManager } = useSynthevery();

    // デフォルトのフォールバック色
    const DEFAULT_BODY_COLOR = '#4B5563'; // ダークグレー
    const DEFAULT_LED_COLOR = '#3B82F6';  // ブルー

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
    }, [deviceConfigManager]);

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
    }, [deviceConfigManager, getDeviceBodyColor]);

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
