'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { VerticalSlider } from './VerticalSlider'
import { useSynthevery } from '@/contexts/SyntheveryContext'
import { useAppState } from '@/hooks/useAppState'

export function MixerFaders() {
    const { playerSyncStates } = useSynthevery()
    const [trackStates, setTrackStates] = useAppState(playerSyncStates.trackStates)

    const setVolume = (i: number, v: number) => {
        const next = trackStates.slice()
        next[i] = { ...next[i], volume: Math.max(0, Math.min(100, Math.floor(v))) }
        setTrackStates(next)
    }
    const toggleMute = (i: number) => {
        const next = trackStates.slice()
        next[i] = { ...next[i], mute: !next[i].mute }
        setTrackStates(next)
    }

    return (
        <div className="h-full overflow-x-auto">
            <div className="grid grid-cols-8 gap-4 min-w-[720px] h-full">
                {trackStates.slice(0, 8).map((t, i) => (
                    <div key={i} className="flex flex-col items-center gap-3 h-full">
                        <div className="text-xs font-medium">{i + 1}</div>
                        <div className="flex-1 flex items-center">
                            <VerticalSlider value={t.volume} onChange={(v) => setVolume(i, v)} />
                        </div>
                        <Button size="sm" variant={t.mute ? 'secondary' : 'default'} onClick={() => toggleMute(i)}>
                            {t.mute ? 'Unmute' : 'Mute'}
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}


