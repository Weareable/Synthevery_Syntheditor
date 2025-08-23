import React from 'react';
import { cn } from '@/lib/utils';

export interface DeviceIconProps {
    /**
     * デバイス本体色（HEX形式）
     * @default '#4B5563' (ダークグレー)
     */
    bodyColor?: string;

    /**
     * LED色（HEX形式）
     * @default '#3B82F6' (ブルー)
     */
    ledColor?: string;

    /**
     * LED状態
     * @default 'off'
     */
    ledStatus?: 'on' | 'off' | 'blink';

    /**
     * アイコンサイズ
     * @default 'md'
     */
    size?: 'sm' | 'md' | 'lg';

    /**
     * 追加のCSSクラス
     */
    className?: string;
}

/**
 * デバイスアイコンコンポーネント
 * 
 * デバイスの色とLED状態を視覚的に表現するアイコンです。
 * 正方形ベースの同心円デザインで、デバイスの物理的な外観を模倣しています。
 */
export const DeviceIcon: React.FC<DeviceIconProps> = ({
    bodyColor = '#4B5563',
    ledColor = '#3B82F6',
    ledStatus = 'off',
    size = 'md',
    className
}) => {
    // サイズ設定
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    // LED点滅アニメーション用のクラス
    const ledAnimationClass = ledStatus === 'blink' ? 'animate-pulse' : '';

    // LED表示の透明度
    const ledOpacity = ledStatus === 'off' ? 0.3 : 1.0;

    return (
        <div
            data-slot="device-icon"
            className={cn(
                'relative flex items-center justify-center',
                'rounded-lg border-2',
                sizeClasses[size],
                className
            )}
            style={{
                backgroundColor: bodyColor,
                borderColor: bodyColor
            }}
            role="img"
            aria-label={`デバイスアイコン (LED: ${ledStatus})`}
        >
            {/* 外枠（デバイス本体） */}
            <div
                className="absolute inset-1 rounded border"
                style={{
                    backgroundColor: bodyColor,
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                }}
            />

            {/* 中央のボタン（LED表示領域） */}
            <div
                className={cn(
                    'relative rounded-full border',
                    'flex items-center justify-center',
                    size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-5 h-5' : 'w-7 h-7',
                    ledAnimationClass
                )}
                style={{
                    backgroundColor: ledColor,
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    opacity: ledOpacity
                }}
            >
                {/* LED光彩効果（点灯時のみ） */}
                {ledStatus !== 'off' && (
                    <div
                        className={cn(
                            'absolute inset-0 rounded-full',
                            'blur-sm'
                        )}
                        style={{
                            backgroundColor: ledColor,
                            transform: 'scale(1.5)',
                            opacity: 0.6
                        }}
                    />
                )}

                {/* LED中央部 */}
                <div
                    className={cn(
                        'relative rounded-full',
                        size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'
                    )}
                    style={{
                        backgroundColor: ledStatus !== 'off' ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                        opacity: ledStatus !== 'off' ? 0.9 : 0.5
                    }}
                />
            </div>

            {/* デバイス表面のテクスチャ（細部表現） */}
            <div
                className="absolute inset-2 rounded"
                style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)`,
                    pointerEvents: 'none'
                }}
            />
        </div>
    );
};
