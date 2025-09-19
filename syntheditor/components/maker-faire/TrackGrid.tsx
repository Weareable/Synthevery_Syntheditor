'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrackToggleCard } from './TrackToggleCard'
import { useSynthevery } from '@/contexts/SyntheveryContext'
import { useAppState } from '@/hooks/useAppState'
import { useTrackConfig } from '@/hooks/useTrackConfig'

export function TrackGrid() {
    const { playerSyncStates } = useSynthevery()
    const [trackStates, setTrackStates] = useAppState(playerSyncStates.trackStates)
    const { trackDetails, isReady } = useTrackConfig()

    const toggleMute = (i: number) => {
        const next = trackStates.slice()
        next[i] = { ...next[i], mute: !next[i].mute }
        setTrackStates(next)
    }

    // trackConfigから実際に使用されているトラック数を取得
    const activeTrackCount = isReady ? trackDetails.length : 0
    const canAdd = isReady && activeTrackCount < 8

    return (
        <div className="grid grid-cols-4 grid-rows-2 gap-4 h-full">
            {/* 未受信時は全てSkeleton、受信後は実際のトラック数分表示 */}
            {isReady ? (
                <>
                    {trackStates.slice(0, activeTrackCount).map((t, i) => (
                        <Card key={i} className="p-0 overflow-hidden">
                            <TrackToggleCard
                                trackNumber={i + 1}
                                isMuted={t.mute}
                                onToggle={() => toggleMute(i)}
                            />
                        </Card>
                    ))}
                    {/* 追加ボタン（8トラック未満の場合のみ） */}
                    {canAdd && (
                        <Card className="p-4 grid place-items-center border-dashed cursor-pointer hover:bg-accent/50 transition-colors">
                            <span className="text-xl">+</span>
                        </Card>
                    )}
                    {/* 残りの空白カードを追加（8個まで埋める） */}
                    {Array.from({ length: Math.max(0, 8 - activeTrackCount - (canAdd ? 1 : 0)) }).map((_, i) => (
                        <Card key={`empty-${i}`} className="p-4">
                            <Skeleton className="h-full w-full" />
                        </Card>
                    ))}
                </>
            ) : (
                /* 未受信時は全てSkeleton */
                Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={`skeleton-${i}`} className="h-full w-full rounded-lg" />
                ))
            )}
        </div>
    )
}


