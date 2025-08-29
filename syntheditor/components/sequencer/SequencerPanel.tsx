'use client'
import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { SequencerCard } from './SequencerCard'
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
            <div className="p-2 basis-0 box-border grid grid-cols-[repeat(4,_minmax(0px,_1fr))] grid-rows-[repeat(2,_minmax(0px,_1fr))] gap-2 grow-[2] h-full min-h-px min-w-px overflow-visible relative rounded shrink-0">
                {tracks.map((track) => (
                    <div
                        key={track.id}
                        className="[grid-area:1_/_1] box-border content-stretch flex flex-col items-center justify-start overflow-visible relative shrink-0"
                        style={{
                            gridArea: track.id <= 4
                                ? `1 / ${track.id}`
                                : `2 / ${track.id - 4}`
                        }}
                    >
                        <SequencerCard
                            trackNumber={track.id}
                            instrumentName={track.instrument}
                            isSelected={selectedTrack === track.id}
                            onClick={() => handleTrackSelect(track.id)}
                        />
                    </div>
                ))}
            </div>

            {/* トラック詳細パネル（右側） */}
            <TrackDetailPanel
                trackName={selectedTrackData ? selectedTrackData.name : "No Track Selected"}
                className="grow-[1]"
            />
        </div>
    )
}
