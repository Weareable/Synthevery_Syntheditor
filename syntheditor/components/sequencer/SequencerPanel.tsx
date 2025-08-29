'use client'
import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { SequencerCardGroup } from './SequencerCardGroup'
import { TrackDetailPanel } from './TrackDetailPanel'

interface Track {
    id: number
    name: string
    instrument: string
}

export function SequencerPanel() {
    const [selectedTrack, setSelectedTrack] = useState<number | null>(1)

    // サンプルトラックデータ
    const tracks: Track[] = [
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
            <SequencerCardGroup
                tracks={tracks}
                className="grow-[2]"
            />

            {/* トラック詳細パネル（右側） */}
            <TrackDetailPanel
                tracks={tracks}
                selectedTrack={selectedTrack}
                onTrackSelect={handleTrackSelect}
                trackName={selectedTrackData ? selectedTrackData.name : "No Track Selected"}
                className="grow-[1]"
            />
        </div>
    )
}
