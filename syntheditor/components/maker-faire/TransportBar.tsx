'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSynthevery } from '@/contexts/SyntheveryContext'
import useDeviceControl from '@/hooks/useDeviceControl'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useAppState, useReadOnlyAppState } from '@/hooks/useAppState'

export function TransportBar() {
    const { playerSyncStates } = useSynthevery()
    const { setPlayingState, setBpmState, stop } = useDeviceControl()

    const [isQ, setQ] = useAppState(playerSyncStates.quantizerState)
    const [isM, setM] = useAppState(playerSyncStates.metronomeState)
    const [isRec, setRec] = useAppState(playerSyncStates.recorderState)
    const tick = useReadOnlyAppState(playerSyncStates.tickClockState)

    const [localBpm, setLocalBpm] = useState(tick.bpm)
    useEffect(() => setLocalBpm(tick.bpm), [tick.bpm])

    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const updateBpm = useCallback((bpm: number) => {
        setLocalBpm(bpm)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setBpmState(bpm), 300)
    }, [setBpmState])

    return (
        <div className="flex items-center justify-center gap-4 p-2 h-full">
            <span className="text-lg font-medium">BPM</span>
            <Input
                type="number"
                value={localBpm}
                onChange={(e) => updateBpm(Number(e.target.value))}
                className="w-32 h-16 text-lg"
                min="60"
                max="200"
            />
            <Toggle pressed={tick.playing} onPressedChange={() => setPlayingState(!tick.playing)} className="w-20 h-20 text-lg">
                {tick.playing ? '⏸' : '▶'}
            </Toggle>
            <Toggle pressed={isRec} onPressedChange={setRec} className="w-20 h-20 text-lg">
                ●
            </Toggle>
            <Toggle pressed={isM} onPressedChange={setM} className="w-20 h-20 text-lg">M</Toggle>
            <Toggle pressed={isQ} onPressedChange={setQ} className="w-20 h-20 text-lg">Q</Toggle>
        </div>
    )
}


