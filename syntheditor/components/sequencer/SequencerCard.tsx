'use client'
import React from 'react'
import { cn } from '@/lib/utils'
import { LoopIndicator } from './LoopIndicator'
import { useSynthevery } from '@/contexts/SyntheveryContext'
import { useAppState, useReadOnlyAppState } from '@/hooks/useAppState'

interface SequencerCardProps {
    trackNumber: number
    instrumentName: string
    isActive?: boolean
    isSoloMode?: boolean
    isSoloTrack?: boolean
    className?: string
    onMuteToggle?: () => void
}

export function SequencerCard({
    trackNumber,
    instrumentName,
    isActive = false,
    isSoloMode = false,
    isSoloTrack = false,
    className,
    onMuteToggle
}: SequencerCardProps) {
    const { playerSyncStates } = useSynthevery()
    const [trackStates, updateTrackStates] = useAppState(playerSyncStates.trackStates)
    const tickClockState = useReadOnlyAppState(playerSyncStates.tickClockState)

    // 現在のトラックの状態を取得
    const currentTrackState = trackStates[trackNumber - 1] || { loopLengthTick: 1920, mute: false, volume: 100 }

    // 現在のステップ位置を計算（tickClockStateから取得）
    const currentStep = tickClockState.playing ? Math.floor((Date.now() % 8000) / (8000 / 32)) : 0
    const totalSteps = 32 // 固定値、後でtrackStateから取得可能

    // トラックのミュート状態を切り替え（親コンポーネントから制御）
    const handleMuteToggle = () => {
        if (onMuteToggle) {
            onMuteToggle()
        }
    }

    return (
        <div
            className={cn(
                "box-border content-stretch flex flex-col items-center justify-start relative size-full cursor-pointer transition-all",
                currentTrackState.mute && "opacity-50",
                className
            )}
            onClick={() => {
                // カードクリックでミュート/アンミュートを切り替え
                handleMuteToggle()
            }}
        >
            <div className="basis-0 grow min-h-px min-w-px relative rounded-[5px] shrink-0 w-full h-full">
                <div className="box-border content-stretch flex flex-col gap-1 items-end justify-start overflow-hidden p-2 relative size-full">
                    <div className="flex flex-col font-normal justify-center leading-[0] relative shrink-0 text-xs text-center text-foreground w-full">
                        <div className="flex items-center justify-between w-full">
                            <p className="leading-[normal]">{trackNumber}: {instrumentName}</p>
                            {/* アクティブインジケータ */}
                            {isActive && (
                                <div className="w-3 h-3 rounded-full bg-primary border border-primary-foreground" />
                            )}
                        </div>
                        {/* トラック状態表示 */}
                        <div className="flex items-center justify-center gap-1 mt-1">
                            <span className="text-xs text-muted-foreground">
                                Vol: {currentTrackState.volume}
                            </span>
                        </div>
                    </div>
                    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full h-full">
                        {/* 両辺を考慮しつつ最大の正方形でフィット（コンテナクエリ単位使用） */}
                        <div className="absolute inset-x-0 bottom-[7.45%] top-[7.45%] flex items-center justify-center [container-type:size]">
                            <div className="w-[min(100cqw,100cqh)] h-[min(100cqw,100cqh)]">
                                <LoopIndicator
                                    currentStep={currentStep}
                                    totalSteps={totalSteps}
                                    isPlaying={tickClockState.playing}
                                    bpm={tickClockState.bpm}
                                    loopLengthMs={(60 / tickClockState.bpm) * 4 * 1000} // 4拍分のループ
                                    className="w-full h-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    aria-hidden="true"
                    className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[5px]"
                />
            </div>
        </div>
    )
}
