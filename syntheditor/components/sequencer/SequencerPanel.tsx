'use client'
import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { SequencerCardGroup } from './SequencerCardGroup'
import { TrackDetailPanel } from './TrackDetailPanel'
import { useTrackConfig } from '@/hooks/useTrackConfig'

interface Track {
    id: number
    name: string
    instrument: string
}

export function SequencerPanel() {
    const [selectedTrack, setSelectedTrack] = useState<number | null>(1)
    const { trackDetails, isReady } = useTrackConfig()

    // トラックコンフィグに準拠したトラック配列（未準備時は従来の8件をフォールバック）
    const tracks: Track[] = isReady && trackDetails.length > 0
        ? trackDetails.map((td, idx) => ({
            id: idx + 1,
            name: `${idx + 1}: ${td.displayName}`,
            instrument: td.displayName,
        }))
        : [
            { id: 1, name: "1: Piano", instrument: "Piano" },
            { id: 2, name: "2: Piano", instrument: "Piano" },
            { id: 3, name: "3: Piano", instrument: "Piano" },
            { id: 4, name: "4: Piano", instrument: "Piano" },
            { id: 5, name: "5: Piano", instrument: "Piano" },
            { id: 6, name: "6: Piano", instrument: "Piano" },
            { id: 7, name: "7: Piano", instrument: "Piano" },
            { id: 8, name: "8: Piano", instrument: "Piano" },
        ]

    const handleTrackSelect = (trackId: number) => {
        setSelectedTrack(trackId)
    }

    const selectedTrackData = tracks.find(track => track.id === selectedTrack)

    return (
        <div className="bg-card content-stretch flex items-start justify-start relative rounded w-full h-full">
            {/* トラックパネル（左側） */}
            {isReady ? (
                <SequencerCardGroup
                    tracks={tracks}
                    className="grow-[2]"
                />
            ) : (
                <div className="grow-[2] w-full h-full flex items-center justify-center" aria-busy="true" aria-live="polite">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p>Loading track configuration...</p>
                    </div>
                </div>
            )}

            {/* トラック詳細パネル（右側） */}
            {isReady && (
                <TrackDetailPanel
                    tracks={tracks}
                    selectedTrack={selectedTrack}
                    onTrackSelect={handleTrackSelect}
                    trackName={selectedTrackData ? selectedTrackData.name : "No Track Selected"}
                    className="grow-[1]"
                />
            )}
        </div>
    )
}
