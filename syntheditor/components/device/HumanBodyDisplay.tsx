import React from 'react';
import { cn } from '@/lib/utils';
import { DeviceIcon } from './DeviceIcon';
import { P2PMacAddress } from '@/lib/synthevery-core/types/mesh';
import { DevicePosition } from '@/hooks/useDevicePositions';

export interface WearableDeviceInfo {
    address: P2PMacAddress;
    position: DevicePosition;
    alphabetId: string;
    bodyColor: string;
}

export interface HumanBodyDisplayProps {
    /**
     * 装着可能デバイスのリスト
     */
    wearableDevices: WearableDeviceInfo[];

    /**
     * 追加のCSSクラス
     */
    className?: string;
}

/**
 * 人体アイコンと装着位置表示コンポーネント
 * 
 * 人体の図と装着されているデバイスの位置を視覚的に表示します。
 * 手持ちデバイスは表示されません。
 */
export const HumanBodyDisplay: React.FC<HumanBodyDisplayProps> = ({
    wearableDevices,
    className
}) => {
    // 位置ごとにデバイスを分類
    const getDeviceAtPosition = (position: DevicePosition): WearableDeviceInfo | undefined => {
        return wearableDevices.find(device => device.position === position);
    };

    const leftArmDevice = getDeviceAtPosition(DevicePosition.LEFT_ARM);
    const rightArmDevice = getDeviceAtPosition(DevicePosition.RIGHT_ARM);
    const leftLegDevice = getDeviceAtPosition(DevicePosition.LEFT_LEG);
    const rightLegDevice = getDeviceAtPosition(DevicePosition.RIGHT_LEG);

    // デバイスマーカーコンポーネント
    const DeviceMarker: React.FC<{
        device: WearableDeviceInfo;
        className?: string;
    }> = ({ device, className: markerClassName }) => (
        <div className={cn('flex flex-col items-center gap-1', markerClassName)}>
            <DeviceIcon
                bodyColor={device.bodyColor}
                ledColor={device.bodyColor}
                ledStatus="on"
                size="sm"
            />
            <div className="text-xs font-bold text-white bg-black/60 rounded px-1">
                {device.alphabetId}
            </div>
        </div>
    );

    return (
        <div className={cn("flex flex-col items-center justify-center p-4", className)}>
            {/* 装着デバイス数の表示 */}
            <div className="mb-4 text-center">
                <div className="text-sm text-gray-400">装着デバイス</div>
                <div className="text-xl font-bold text-white">
                    {wearableDevices.length} / 4
                </div>
            </div>

            {/* 人体アイコンとデバイス配置 */}
            <div className="relative">
                {/* 人体アイコン（SVG） */}
                <svg
                    width="120"
                    height="200"
                    viewBox="0 0 120 200"
                    className="text-white"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* 頭部 */}
                    <circle
                        cx="60"
                        cy="25"
                        r="20"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                    />

                    {/* 胴体 */}
                    <rect
                        x="40"
                        y="45"
                        width="40"
                        height="80"
                        rx="8"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                    />

                    {/* 左腕 */}
                    <rect
                        x="15"
                        y="55"
                        width="25"
                        height="15"
                        rx="7"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                    />

                    {/* 右腕 */}
                    <rect
                        x="80"
                        y="55"
                        width="25"
                        height="15"
                        rx="7"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                    />

                    {/* 左足 */}
                    <rect
                        x="45"
                        y="125"
                        width="15"
                        height="60"
                        rx="7"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                    />

                    {/* 右足 */}
                    <rect
                        x="60"
                        y="125"
                        width="15"
                        height="60"
                        rx="7"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                    />
                </svg>

                {/* デバイス配置 */}
                {/* 左腕デバイス */}
                {leftArmDevice && (
                    <div className="absolute" style={{ top: '50px', left: '-20px' }}>
                        <DeviceMarker device={leftArmDevice} />
                    </div>
                )}

                {/* 右腕デバイス */}
                {rightArmDevice && (
                    <div className="absolute" style={{ top: '50px', right: '-20px' }}>
                        <DeviceMarker device={rightArmDevice} />
                    </div>
                )}

                {/* 左足デバイス */}
                {leftLegDevice && (
                    <div className="absolute" style={{ top: '150px', left: '10px' }}>
                        <DeviceMarker device={leftLegDevice} />
                    </div>
                )}

                {/* 右足デバイス */}
                {rightLegDevice && (
                    <div className="absolute" style={{ top: '150px', right: '10px' }}>
                        <DeviceMarker device={rightLegDevice} />
                    </div>
                )}
            </div>

            {/* 装着位置の説明 */}
            {wearableDevices.length === 0 && (
                <div className="mt-4 text-center text-sm text-gray-400">
                    装着位置が設定されているデバイスはありません
                </div>
            )}

            {/* 装着デバイス一覧 */}
            {wearableDevices.length > 0 && (
                <div className="mt-4 w-full">
                    <div className="text-xs text-gray-400 mb-2">装着デバイス一覧</div>
                    <div className="space-y-1">
                        {wearableDevices.map((device) => {
                            const positionLabels = {
                                [DevicePosition.LEFT_ARM]: '左腕',
                                [DevicePosition.RIGHT_ARM]: '右腕',
                                [DevicePosition.LEFT_LEG]: '左足',
                                [DevicePosition.RIGHT_LEG]: '右足',
                                [DevicePosition.HANDHELD]: '手持ち'
                            };

                            return (
                                <div
                                    key={device.alphabetId}
                                    className="flex items-center gap-2 text-xs"
                                >
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: device.bodyColor }}
                                    />
                                    <span className="font-bold text-white">
                                        {device.alphabetId}
                                    </span>
                                    <span className="text-gray-400">
                                        {positionLabels[device.position]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
