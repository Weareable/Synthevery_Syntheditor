import React from 'react';
import { cn } from '@/lib/utils';
import { DeviceIcon } from './DeviceIcon';
import { InstrumentIcon } from '@/components/icons/InstrumentIcon';
import { P2PMacAddress } from '@/lib/synthevery-core/types/mesh';
import { TrackDetail } from '@/lib/synthevery-core/types/player';

export interface DeviceCardProps {
    /**
     * デバイスアドレス
     */
    deviceAddress: P2PMacAddress;

    /**
     * デバイスのアルファベットID（A, B, C...）
     */
    alphabetId: string;

    /**
     * 現在のトラック情報
     */
    currentTrack: {
        index: number;
        detail: TrackDetail;
    };

    /**
     * デバイス本体色
     * @default '#4B5563'
     */
    bodyColor?: string;

    /**
     * LED色
     * @default '#3B82F6'
     */
    ledColor?: string;

    /**
     * LED状態
     * @default 'off'
     */
    ledStatus?: 'on' | 'off' | 'blink';

    /**
     * 追加のCSSクラス
     */
    className?: string;

    /**
     * トラック切り替えコールバック（将来機能）
     */
    onTrackChange?: (deviceAddress: P2PMacAddress, direction: 'prev' | 'next') => void;
}

/**
 * デバイスカードコンポーネント
 * 
 * 個別デバイスの情報を包括的に表示するカードです。
 * デバイスアイコン、ID、現在のトラック情報を含みます。
 */
export const DeviceCard: React.FC<DeviceCardProps> = ({
    deviceAddress,
    alphabetId,
    currentTrack,
    bodyColor = '#4B5563',
    ledColor = '#3B82F6',
    ledStatus = 'off',
    className,
    onTrackChange
}) => {
    // トラック切り替えハンドラー（将来機能）
    const handleTrackChange = (direction: 'prev' | 'next') => {
        if (onTrackChange) {
            onTrackChange(deviceAddress, direction);
        }
    };

    return (
        <div
            data-slot="device-card"
            className={cn(
                'relative',
                'bg-zinc-800 border border-zinc-700',
                'rounded-lg p-3',
                'hover:bg-zinc-700/40 hover:border-zinc-600',
                'transition-all duration-200',
                'min-h-[120px]',
                className
            )}
        >
            {/* ヘッダー部分：デバイスアイコン + ID */}
            <div className="flex items-center gap-3 mb-3">
                {/* デバイスアイコン */}
                <DeviceIcon
                    bodyColor={bodyColor}
                    ledColor={ledColor}
                    ledStatus={ledStatus}
                    size="md"
                />

                {/* デバイスID */}
                <div className="flex-1">
                    <div className="text-xl font-bold text-white">
                        {alphabetId}
                    </div>
                    <div className="text-xs text-gray-400">
                        Device {alphabetId}
                    </div>
                </div>
            </div>

            {/* トラック情報表示 */}
            <div className="space-y-2">
                {/* トラック名 */}
                <div className="text-sm text-gray-300">
                    Track {currentTrack.index + 1}
                </div>

                {/* 楽器情報 */}
                <div className="flex items-center gap-2">
                    {/* 楽器アイコン */}
                    <div className="w-6 h-6 text-gray-300">
                        <InstrumentIcon
                            icon={currentTrack.detail.icon}
                            className="w-full h-full"
                        />
                    </div>

                    {/* 楽器名 */}
                    <div className="text-sm text-white truncate">
                        {currentTrack.detail.displayName}
                    </div>
                </div>
            </div>

            {/* 将来のナビゲーション矢印用スペース */}
            {onTrackChange && (
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-700">
                    {/* 前のトラック */}
                    <button
                        onClick={() => handleTrackChange('prev')}
                        className={cn(
                            'w-6 h-6 rounded',
                            'flex items-center justify-center',
                            'text-gray-400 hover:text-white hover:bg-zinc-600',
                            'transition-colors duration-200'
                        )}
                        aria-label="前のトラック"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* 次のトラック */}
                    <button
                        onClick={() => handleTrackChange('next')}
                        className={cn(
                            'w-6 h-6 rounded',
                            'flex items-center justify-center',
                            'text-gray-400 hover:text-white hover:bg-zinc-600',
                            'transition-colors duration-200'
                        )}
                        aria-label="次のトラック"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            )}

            {/* アクセシビリティ用の説明 */}
            <div className="sr-only">
                デバイス {alphabetId}: {currentTrack.detail.displayName} (Track {currentTrack.index + 1})
            </div>
        </div>
    );
};
