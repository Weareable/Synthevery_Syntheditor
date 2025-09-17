import React, { useState, useEffect, useCallback } from 'react';
import { cn, getDeviceAlphabetId } from '@/lib/utils';
import { Panel } from '@/components/ui/panel';
import { DeviceCard } from './DeviceCard';
import { HumanBodyDisplay } from './HumanBodyDisplay';
import { useDevicePositions } from '@/hooks/useDevicePositions';
import { useDeviceColors } from '@/hooks/useDeviceColors';
import { useTrackConfig } from '@/hooks/useTrackConfig';
import { useAppState } from '@/hooks/useAppState';
import { useSynthevery } from '@/contexts/SyntheveryContext';
import { P2PMacAddress } from '@/lib/synthevery-core/types/mesh';
import { getAddressString, getAddressFromString } from '@/lib/synthevery-core/connection/util';
import useMesh from '@/hooks/useMesh';

export interface DevicePanelProps {
    /**
     * レイアウトモード
     * @default 'auto'
     */
    layoutMode?: '1col' | '2col' | 'auto';

    /**
     * 追加のCSSクラス
     */
    className?: string;
}

/**
 * デバイスパネルコンポーネント
 * 
 * 接続されているSyntheveryデバイスの状態と装着位置を視覚的に表示します。
 * 左側にデバイスカード、右側に人体アイコンと装着位置を表示します。
 */
export const DevicePanel: React.FC<DevicePanelProps> = ({
    layoutMode = 'auto',
    className
}) => {
    const { mesh, deviceConfigManager, playerSyncStates } = useSynthevery();
    const [isBreakpointLarge, setIsBreakpointLarge] = useState(false);

    // 変更: useMeshフックを使用してデバイス接続と順序を取得
    const {
        connectedDevices: meshDevices,
        deviceOrder: meshDeviceOrder,
        isReady: isMeshReady
    } = useMesh();

    const {
        getDevicePosition,
        getWearableDevices,
        isPositionsReady
    } = useDevicePositions();

    const {
        getDeviceBodyColor,
        getDeviceLedColor,
        getDeviceLedStatus
    } = useDeviceColors();

    const {
        trackDetails,
        isReady: isTrackConfigReady
    } = useTrackConfig();

    const [currentTracks] = useAppState(playerSyncStates.currentTracksState);

    // レスポンシブ対応
    useEffect(() => {
        const checkBreakpoint = () => {
            setIsBreakpointLarge(window.innerWidth >= 768);
        };

        checkBreakpoint();
        window.addEventListener('resize', checkBreakpoint);
        return () => window.removeEventListener('resize', checkBreakpoint);
    }, []);

    // 変更: useMeshフックから取得したデバイスを使用
    const connectedDevices = meshDevices.map(addr => getAddressFromString(addr));

    // デバイス順序の優先順位: useMesh > useDeviceOrder
    const finalDeviceOrder = meshDeviceOrder.length > 0 ? meshDeviceOrder.map(addr => getAddressFromString(addr)) : [];

    // 特定デバイスのトラック情報を取得
    const getDeviceTrackInfo = useCallback((deviceAddr: P2PMacAddress) => {
        const deviceKey = getAddressString(deviceAddr);
        const trackIndex = currentTracks.get(deviceKey) ?? 0;
        const trackDetail = trackDetails[trackIndex];

        return {
            index: trackIndex,
            detail: trackDetail || {
                displayName: 'Unknown',
                icon: 'default',
                instrumentPresetId: ''
            }
        };
    }, [currentTracks, trackDetails]);

    // 装着可能デバイスの取得（人体アイコン用）
    const wearableDevices = getWearableDevices().map(wearableDevice => ({
        ...wearableDevice,
        alphabetId: getDeviceAlphabetId(meshDeviceOrder, getAddressString(wearableDevice.address)),
        bodyColor: getDeviceBodyColor(wearableDevice.address)
    }));

    // レイアウトモードの決定
    const actualLayoutMode = layoutMode === 'auto'
        ? (isBreakpointLarge ? '2col' : '1col')
        : layoutMode;

    // グリッドクラスの決定
    const deviceGridClasses = cn(
        'grid gap-3 p-3',
        actualLayoutMode === '2col' ? 'grid-cols-2' : 'grid-cols-1'
    );

    // 準備状態のチェック
    const isReady = isPositionsReady && isTrackConfigReady && isMeshReady;

    // デバッグ用：現在の状態をログ出力
    useEffect(() => {
        console.log('DevicePanel Debug:', {
            isPositionsReady,
            isTrackConfigReady,
            isMeshReady,
            meshDeviceOrderLength: meshDeviceOrder.length,
            finalDeviceOrderLength: finalDeviceOrder.length,
            connectedDevicesLength: connectedDevices.length
        });
    }, [isPositionsReady, isTrackConfigReady, isMeshReady, meshDeviceOrder.length, finalDeviceOrder.length, connectedDevices.length]);

    // ローディング表示
    if (!isReady) {
        return (
            <Panel className={cn("w-full h-full", className)}>
                <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-gray-400">デバイス情報を読み込み中...</p>
                    </div>
                </div>
            </Panel>
        );
    }

    // デバイス未接続時の表示
    if (connectedDevices.length === 0) {
        return (
            <Panel className={cn("w-full h-full", className)}>
                <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4">📱</div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                            デバイスが接続されていません
                        </h3>
                        <p className="text-gray-400">
                            Syntheveryデバイスを接続してください
                        </p>
                    </div>
                </div>
            </Panel>
        );
    }

    return (
        <Panel className={cn("w-full h-full", className)}>
            <div className="w-full h-full flex">
                {/* 左側：デバイスカードリスト */}
                <div className="flex-1 min-w-0">
                    <div className={deviceGridClasses}>
                        {finalDeviceOrder.length > 0 ? finalDeviceOrder.map((deviceAddr) => {
                            const alphabetId = getDeviceAlphabetId(meshDeviceOrder, getAddressString(deviceAddr));
                            const trackInfo = getDeviceTrackInfo(deviceAddr);
                            const bodyColor = getDeviceBodyColor(deviceAddr);
                            const ledColor = getDeviceLedColor(deviceAddr);
                            const ledStatus = getDeviceLedStatus(deviceAddr);

                            return (
                                <DeviceCard
                                    key={`device-${alphabetId}`}
                                    deviceAddress={deviceAddr}
                                    alphabetId={alphabetId}
                                    currentTrack={trackInfo}
                                    bodyColor={bodyColor}
                                    ledColor={ledColor}
                                    ledStatus={ledStatus}
                                />
                            );
                        }) : (
                            <div className="col-span-full text-center py-8">
                                <div className="text-gray-400">
                                    <p>デバイス順序の読み込み中...</p>
                                    <p className="text-sm mt-2">接続されたデバイスの順序情報を待機中です</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 右側：人体アイコンと装着位置 */}
                <div className="flex-none w-64 border-l border-zinc-700">
                    <HumanBodyDisplay
                        wearableDevices={wearableDevices}
                        className="w-full h-full"
                    />
                </div>
            </div>
        </Panel>
    );
};
