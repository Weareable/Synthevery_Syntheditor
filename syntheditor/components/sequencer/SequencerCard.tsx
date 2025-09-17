'use client'
import React from 'react'
import { cn } from '@/lib/utils'
import { LoopIndicator } from './LoopIndicator'
import { useSynthevery } from '@/contexts/SyntheveryContext'
import { useAppState, useReadOnlyAppState } from '@/hooks/useAppState'
import { useTrackConfig } from '@/hooks/useTrackConfig'
import useTickClock from '@/hooks/useTickClock'

interface SequencerCardProps {
    trackNumber: number
    instrumentName: string
    isActive?: boolean
    isSoloMode?: boolean
    isSoloTrack?: boolean
    className?: string
    onMuteToggle?: () => void
    onSoloToggle?: () => void
}

export function SequencerCard({
    trackNumber,
    instrumentName,
    isActive = false,
    isSoloMode = false,
    isSoloTrack = false,
    className,
    onMuteToggle,
    onSoloToggle
}: SequencerCardProps) {
    const { playerSyncStates } = useSynthevery()
    const [trackStates, updateTrackStates] = useAppState(playerSyncStates.trackStates)
    const tickClockState = useReadOnlyAppState(playerSyncStates.tickClockState)
    // TickClock フォロワで実時間ティックを取得
    const { tick } = useTickClock()
    const { trackDetails, isReady } = useTrackConfig()

    // 現在のトラックの状態を取得
    const currentTrackState = trackStates[trackNumber - 1] || { loopLengthTick: 1920, mute: false, volume: 100 }

    // 現在のステップ位置とループ進捗を計算（loopLengthTick と tick から導出）
    const totalSteps = 32 // TODO: trackState から取得可能なら置換
    const ticksPerLoop = currentTrackState.loopLengthTick ?? 1920
    const tickWrapped = ticksPerLoop > 0 ? (tick % ticksPerLoop) : 0
    const loopProgress = ticksPerLoop > 0 ? (tickWrapped / ticksPerLoop) : 0
    const currentStep = tickClockState.playing ? Math.floor(loopProgress * totalSteps) : 0


    // 表示上のミュート判定は isActive を優先して同期させる
    const isMutedDisplay = !isActive
    const isSoloActive = isSoloMode && isSoloTrack

    // トラックのミュート状態を切り替え（親コンポーネントから制御）
    const handleMuteToggle = () => {
        if (onMuteToggle) {
            onMuteToggle()
        }
    }

    return (
        <div
            key={`${trackNumber}-${String(isActive)}-${String(isMutedDisplay)}`}
            className={cn(
                "box-border content-stretch flex flex-col items-center justify-start relative size-full cursor-pointer transition-all p-1.5 shadow-md",
                isMutedDisplay && "opacity-50",
                className
            )}
            onClick={() => {
                // カードクリックでミュート/アンミュートを切り替え
                handleMuteToggle()
            }}
        >
            <div key={`${trackNumber}-${String(isActive)}-${String(isMutedDisplay)}`} className="basis-0 grow min-h-px min-w-px relative rounded-md shrink-0 w-full h-full bg-card">
                <div className="box-border content-stretch flex flex-col gap-1 items-center justify-center overflow-hidden p-2.5 relative size-full">
                    <div className="flex flex-col font-normal justify-center leading-none relative shrink-0 text-xs text-center text-foreground w-full">
                        <div className="flex items-center justify-between w-full">
                            <p className="leading-normal">{trackNumber}: {isReady && trackDetails[trackNumber - 1]?.displayName ? trackDetails[trackNumber - 1]?.displayName : instrumentName}</p>
                            {/* 右上インジケータ: アクティブ時は塗りつぶし、ミュート時は中抜き */}
                            {isActive ? (
                                <div className="w-3 h-3 rounded-full bg-foreground border border-foreground" />
                            ) : isMutedDisplay ? (
                                <div className="w-3 h-3 rounded-full border border-muted-foreground" />
                            ) : null}
                        </div>
                        {/* トラック状態表示 */}
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                                Vol: {currentTrackState.volume}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Len: {currentTrackState.loopLengthTick}t ({Math.max(1, Math.round((currentTrackState.loopLengthTick ?? 0) / 480))}b)
                            </span>
                        </div>
                    </div>
                    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full h-full">
                        {/* 両辺を考慮しつつ最大の正方形でフィット（コンテナクエリ単位使用） */}
                        <div className="absolute inset-x-0 bottom-[7.45%] top-[7.45%] flex items-center justify-center [container-type:size]">
                            <div className="w-[min(100cqw,100cqh)] h-[min(100cqw,100cqh)]">
                                <LoopIndicator
                                    progress={loopProgress}
                                    currentStep={currentStep}
                                    totalSteps={totalSteps}
                                    isPlaying={tickClockState.playing}
                                    className="w-full h-full"
                                />
                            </div>
                        </div>
                    </div>
                    {/* SOLO バー（クリックでソロ切替） */}
                    <div className="h-6 relative rounded-md w-full">
                        <button
                            type="button"
                            aria-pressed={isSoloActive}
                            className="box-border flex flex-col gap-1 h-6 items-center justify-center overflow-hidden px-2.5 w-full"
                            onClick={(e) => {
                                e.stopPropagation()
                                if (onSoloToggle) onSoloToggle()
                            }}
                        >
                            <p className={cn("text-xs leading-none", isSoloActive ? "text-foreground" : "text-muted-foreground")}>SOLO</p>
                        </button>
                        <div
                            aria-hidden="true"
                            className={cn(
                                "absolute inset-0 pointer-events-none rounded-md border border-b-2",
                                isSoloActive ? "border-foreground" : "border-muted-foreground"
                            )}
                        />
                    </div>
                </div>
                {isMutedDisplay ? (
                    <div
                        key={`muted-${String(isActive)}`}
                        aria-hidden="true"
                        className="absolute inset-0 pointer-events-none rounded-md border border-muted-foreground border-b-4"
                    />
                ) : (
                    <div
                        key={`unmuted-${String(isActive)}`}
                        aria-hidden="true"
                        className="absolute inset-0 pointer-events-none rounded-md border border-foreground border-t-4"
                    />
                )}
            </div>
        </div>
    )
}
