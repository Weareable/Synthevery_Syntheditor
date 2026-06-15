import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Panel } from '@/components/ui/panel';
import { TrackCard } from './TrackCard';
import { AddTrackButton } from './add-track-button';
import { useTrackConfig } from '@/hooks/useTrackConfig';
import { useAppState } from '@/hooks/useAppState';
import { useSynthevery } from '@/contexts/SyntheveryContext';
import { trackMask, isTrackInMask, primaryTrackIndex } from '@/lib/synthevery-core/player/track-edit-mask';

export interface TrackSelectPanelProps {
    onEditTrack?: (trackIndex: number) => void;
}

/**
 * トラック選択パネルコンポーネント
 */
export const TrackSelectPanel: React.FC<TrackSelectPanelProps> = ({
    onEditTrack
}) => {
    const { playerSyncStates } = useSynthevery();
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

    // useTrackConfigフックを使用
    const {
        trackDetails,
        isReady,
        getConnectedDeviceCount
    } = useTrackConfig();

    // playerSyncStatesからトラック選択状態を取得
    const [currentTracks, updateCurrentTracks] = useAppState(playerSyncStates.currentTracksState);

    // トラック選択の処理
    const handleTrackSelect = useCallback((trackIndex: number) => {
        if (trackIndex < 0 || trackIndex >= 8) {
            console.warn('Invalid track index:', trackIndex);
            return;
        }

        // currentTracksの全要素を当該トラックに変更
        const mask = trackMask(trackIndex);
        const newCurrentTracks = new Map();
        currentTracks.forEach((_, deviceId) => {
            newCurrentTracks.set(deviceId, mask);
        });

        // 全デバイスを同じトラックに設定
        updateCurrentTracks(newCurrentTracks);
        console.log('All devices set to track:', trackIndex);
    }, [currentTracks, updateCurrentTracks]);

    // 楽器編集の処理
    const handleTrackEdit = useCallback((trackIndex: number) => {
        if (onEditTrack) {
            onEditTrack(trackIndex);
        }
    }, [onEditTrack]);

    // 新規トラック追加の処理（将来的な機能）
    const handleAddTrack = useCallback(() => {
        console.log('Add new track - Future feature');
        // TODO: 新規トラック追加の実装
    }, []);

    // 特定トラックの選択状態を判定
    const isTrackSelected = useCallback((trackIndex: number): boolean => {
        // currentTracksのマップで、全デバイスが同じトラックであるかどうかで判定
        if (currentTracks.size === 0) return false;

        // 全デバイスが同じトラックを選択しているかチェック
        const targetMask = trackMask(trackIndex);
        const allSameTrack = Array.from(currentTracks.values()).every(
            mask => mask === targetMask
        );
        return allSameTrack;
    }, [currentTracks]);

    // 特定トラックのデバイス数を取得
    const getDeviceCountForTrack = useCallback((trackIndex: number): number => {
        // currentTracksで選択されているデバイス数をカウント
        let count = 0;
        currentTracks.forEach((mask) => {
            if (isTrackInMask(mask, trackIndex)) {
                count++;
            }
        });
        return count;
    }, [currentTracks]);

    // 接続済みデバイス数を取得
    const connectedDeviceCount = getConnectedDeviceCount();

    // 単一・複数選択状態の判定
    const isMultiSelectModeActive = useCallback((): boolean => {
        if (currentTracks.size <= 1) return false;

        // 全デバイスが同じトラックを選択している場合は単一選択
        const tracks = Array.from(currentTracks.values());
        const firstMask = tracks[0];
        const allSameTrack = tracks.every(mask => mask === firstMask);

        return !allSameTrack; // 異なるトラックを選択している場合は複数選択
    }, [currentTracks]);

    // 複数選択モードの状態を更新
    useEffect(() => {
        setIsMultiSelectMode(isMultiSelectModeActive());
    }, [isMultiSelectModeActive]);

    // デバッグ用：trackDetailsの変更をログ出力
    useEffect(() => {
        console.log('TrackSelectPanel: trackDetails updated:', trackDetails);
    }, [trackDetails]);

    // 準備状態のログ出力
    useEffect(() => {
        console.log('TrackSelectPanel: isReady changed:', isReady);
    }, [isReady]);

    // 準備が完了していない場合はローディング表示
    if (!isReady) {
        return (
            <Panel className={cn("w-full h-full")}>
                <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p>Loading track configuration...</p>
                    </div>
                </div>
            </Panel>
        );
    }

    return (
        <Panel className={cn(
            "w-full h-full"
        )}>
            {/* トラックグリッド（4列固定） */}
            <div className="w-full h-full grid grid-cols-4 gap-2 p-2">
                {/* 既存のトラックカード */}
                {trackDetails.map((trackDetail, index) => (
                    <TrackCard
                        key={index}
                        trackIndex={index}
                        trackDetail={trackDetail}
                        isSelected={isTrackSelected(index)}
                        isMultiSelected={isMultiSelectMode}
                        deviceCount={getDeviceCountForTrack(index)}
                        onSelect={handleTrackSelect}
                        onEdit={handleTrackEdit}
                    />
                ))}

                {/* 新規追加ボタン（n+1番目の要素として表示） */}
                {trackDetails.length < 8 && (
                    <div key="add-button" className="w-full h-full min-w-0 min-h-0">
                        <AddTrackButton onClick={handleAddTrack} />
                    </div>
                )}
            </div>
        </Panel>
    );
};
