'use client'
import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { SequencerCard } from './SequencerCard'
// import { SoloButton } from './SoloButton'
import { useSynthevery } from '@/contexts/SyntheveryContext'
import { useAppState } from '@/hooks/useAppState'

interface Track {
    id: number
    name: string
    instrument: string
}

interface SequencerCardGroupProps {
    tracks: Track[]
    className?: string
}

export function SequencerCardGroup({
    tracks,
    className
}: SequencerCardGroupProps) {
    const { playerSyncStates } = useSynthevery()
    const [trackStates, updateTrackStates] = useAppState(playerSyncStates.trackStates)

    // ソロモードの状態管理
    const [soloMode, setSoloMode] = useState(false)
    const [soloTrackId, setSoloTrackId] = useState<number | null>(null)

    // ソロモードの切り替え
    const toggleSoloMode = useCallback((trackId: number) => {
        if (soloMode && soloTrackId === trackId) {
            // ソロモードを解除
            setSoloMode(false)
            setSoloTrackId(null)
            // 全トラックのミュートを解除
            const newTrackStates = trackStates.map(track => ({
                ...track,
                mute: false
            }))
            updateTrackStates(newTrackStates)
        } else {
            // ソロモードを有効化
            setSoloMode(true)
            setSoloTrackId(trackId)
            // 選択されたトラック以外をミュート
            const newTrackStates = trackStates.map((track, index) => ({
                ...track,
                mute: index !== trackId - 1
            }))
            updateTrackStates(newTrackStates)
        }
    }, [soloMode, soloTrackId, trackStates, updateTrackStates])

    // トラックのミュート状態を切り替え
    const toggleTrackMute = useCallback((trackId: number) => {
        if (soloMode) {
            // ソロモード中はソロ機能を使用
            toggleSoloMode(trackId)
        } else {
            // 通常のミュート切り替え
            const newTrackStates = [...trackStates]
            newTrackStates[trackId - 1] = {
                ...newTrackStates[trackId - 1],
                mute: !newTrackStates[trackId - 1].mute
            }
            updateTrackStates(newTrackStates)
        }
    }, [soloMode, trackStates, updateTrackStates, toggleSoloMode])

    // トラックがアクティブかどうかを判定
    const isTrackActive = useCallback((trackId: number) => {
        const trackState = trackStates[trackId - 1]
        return trackState && !trackState.mute
    }, [trackStates])

    return (
        <div className={cn(
            "p-2 basis-0 box-border grid grid-cols-[repeat(4,_minmax(0px,_1fr))] grid-rows-[repeat(2,_minmax(0px,_1fr))] gap-2 grow-[2] h-full min-h-px min-w-px overflow-visible relative rounded shrink-0",
            className
        )}>
            {tracks.map((track) => {
                const active = isTrackActive(track.id)
                const muted = !!trackStates[track.id - 1]?.mute
                return (
                    <div
                        key={`${track.id}-${String(active)}-${String(muted)}`}
                        className="[grid-area:1_/_1] box-border content-stretch flex flex-col gap-[5px] items-center justify-start overflow-visible relative shrink-0"
                        style={{
                            gridArea: track.id <= 4
                                ? `1 / ${track.id}`
                                : `2 / ${track.id - 4}`
                        }}
                    >
                        <SequencerCard
                            trackNumber={track.id}
                            instrumentName={track.instrument}
                            isActive={active}
                            isSoloMode={soloMode}
                            isSoloTrack={soloTrackId === track.id}
                            onMuteToggle={() => toggleTrackMute(track.id)}
                            onSoloToggle={() => toggleSoloMode(track.id)}
                        />
                        {/* 外部SOLOボタンはカード内操作に統一するため非表示 */}
                    </div>
                )
            })}
        </div>
    )
}
