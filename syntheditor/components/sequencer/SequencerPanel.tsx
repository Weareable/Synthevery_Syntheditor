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
        <div className="bg-[#303030] content-stretch flex items-start justify-start relative rounded-[5px] size-full">
            {/* トラックパネル（左側） */}
            <div className="basis-0 box-border gap-2.5 grid grid-cols-[repeat(4,_minmax(0px,_1fr))] grid-rows-[repeat(2,_minmax(0px,_1fr))] grow h-[318px] min-h-px min-w-px overflow-clip p-[10px] relative rounded-[5px] shrink-0">
                {tracks.map((track) => (
                    <div
                        key={track.id}
                        className="[grid-area:1_/_1] box-border content-stretch flex flex-col gap-2.5 items-center justify-start overflow-clip p-[5px] relative shrink-0"
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
            />
        </div>
    )
}
