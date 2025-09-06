'use client'

import React, { useCallback, useRef, useState, useEffect } from 'react'
import { Panel } from '@/components/ui/panel'
import { OneshotButton } from '@/components/ui/oneshot-button'
import { ToggleButton } from '@/components/ui/toggle-button'
import { VerticalDivider } from '@/components/ui/vertical-divider'
import { PlayingToggleButton } from '@/components/ui/playing-toggle-button'
import { StopIcon, RecordIcon } from '@/components/icons/media'
import { UndoIcon, RedoIcon } from '@/components/icons/control'
import BPMInput from './ui/bpm-input'
import { useAppState, useReadOnlyAppState } from '@/hooks/useAppState'
import useDeviceControl from '@/hooks/useDeviceControl'
import { useSynthevery } from '@/contexts/SyntheveryContext'

export function MediaControlBar() {
    const { playerSyncStates } = useSynthevery();

    // AppStateを使用した状態管理
    const [isQActive, setIsQActive] = useAppState(playerSyncStates.quantizerState);
    const [isMActive, setIsMActive] = useAppState(playerSyncStates.metronomeState);
    const [isRecording, setIsRecording] = useAppState(playerSyncStates.recorderState);

    // プレイヤーコントロール
    const { setPlayingState, setBpmState, stop } = useDeviceControl();

    // AppStateからBPM値とPlaying状態を読み取り
    const tickClockState = useReadOnlyAppState(playerSyncStates.tickClockState);
    const appStateBpm = tickClockState.bpm;
    const appStatePlaying = tickClockState.playing;

    // BPMInput用のローカル状態（UI応答性のため）
    const [localBpm, setLocalBpm] = useState(appStateBpm);

    // AppStateのBPMが変更されたらローカル状態を更新
    useEffect(() => {
        setLocalBpm(appStateBpm);
    }, [appStateBpm]);

    // デバウンス用タイマー
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // デバウンス付きBPM変更
    const debouncedSetBpm = useCallback((newBpm: number) => {
        // ローカル状態を即座に更新（UI応答性のため）
        setLocalBpm(newBpm);

        // 既存のタイマーをクリア
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // 新しいタイマーを設定（500ms待機）
        debounceTimerRef.current = setTimeout(() => {
            // PlayerControllerを通してBPMを設定（デバイス間同期）
            setBpmState(newBpm);
        }, 500);
    }, [setBpmState]);

    return (
        <Panel className="flex gap-2 items-center p-2 w-full justify-center">
            <div className="flex gap-2 items-center">
                <ToggleButton
                    size="default"
                    pressed={isQActive}
                    onPressedChange={setIsQActive}
                >
                    Q
                </ToggleButton>
                <ToggleButton
                    size="default"
                    pressed={isMActive}
                    onPressedChange={setIsMActive}
                >
                    M
                </ToggleButton>
                <BPMInput
                    value={localBpm}
                    onBpmChange={debouncedSetBpm}
                />
            </div>
            <VerticalDivider variant="background" size="lg" />
            <div className="flex gap-2 items-center">
                <PlayingToggleButton isPlaying={appStatePlaying} onChange={setPlayingState} />
                <OneshotButton
                    variant="default"
                    size="default"
                    onClick={stop}
                >
                    <StopIcon width={10} height={10} strokeWidth={2} />
                </OneshotButton>
            </div>
            <VerticalDivider variant="background" size="lg" />
            <div className="flex gap-2 items-center">
                <OneshotButton
                    variant="default"
                    size="default"
                    onClick={() => console.log('OneshotButton clicked!')}
                >
                    <UndoIcon width={10} height={10} strokeWidth={2} />
                </OneshotButton>
                <ToggleButton
                    size="default"
                    pressed={isRecording}
                    onPressedChange={setIsRecording}
                >
                    <RecordIcon width={10} height={10} strokeWidth={2} />
                </ToggleButton>
                <OneshotButton
                    variant="default"
                    size="default"
                    onClick={() => console.log('OneshotButton clicked!')}
                >
                    <RedoIcon width={10} height={10} strokeWidth={2} />
                </OneshotButton>
            </div>
        </Panel>
    )
} 