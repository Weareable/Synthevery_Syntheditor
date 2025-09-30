'use client'

import React, { useMemo } from 'react'
import { SequencerViz } from '@/components/maker-faire/SequencerViz'
import { useReadOnlyAppState } from '@/hooks/useAppState'
import { useSynthevery } from '@/contexts/SyntheveryContext'
import { useCrdtProjection } from '@/hooks/useCrdtProjection'

export function SequencerVizEmbed() {
    const { playerSyncStates, crdtProjectionStore } = useSynthevery()
    const tick = useReadOnlyAppState(playerSyncStates.tickClockState)
    const { projections } = useCrdtProjection()
    const tracksProjection = useMemo(() => {
        const trackStates = playerSyncStates.trackStates.getStore().value
        return projections.map((p, idx) => {
            const loop = trackStates[idx]?.loopLengthTick ?? 1920
            const noteTicks = p.notes.map(n => n.tick)
            return { loopLengthTick: loop, noteTicks }
        })
    }, [projections, playerSyncStates])
    // CRDT はストアが常に最新を保持。UI は参照のみ。
    return <SequencerViz bpm={tick.bpm} tracksProjection={tracksProjection} />
}


