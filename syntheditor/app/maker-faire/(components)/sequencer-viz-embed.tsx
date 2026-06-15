'use client'

import React, { useMemo } from 'react'
import { SequencerViz } from '@/components/maker-faire/SequencerViz'
import { useReadOnlyAppState, useAppState } from '@/hooks/useAppState'
import { useSynthevery } from '@/contexts/SyntheveryContext'
import { useCrdtProjection } from '@/hooks/useCrdtProjection'

export function SequencerVizEmbed() {
    const { playerSyncStates, crdtProjectionStore } = useSynthevery()
    const tick = useReadOnlyAppState(playerSyncStates.tickClockState)
    const { projections } = useCrdtProjection()
    const [trackStates] = useAppState(playerSyncStates.trackStates)
    const tracksProjection = useMemo(() => {
        return projections.map((p, idx) => {
            const loop = trackStates[idx]?.loopLengthTick ?? 1920
            const isMuted = trackStates[idx]?.mute === true
            // ループ長を超えるノートは非表示（0 <= tick < loop のみ採用）
            const noteTicks = p.notes
                .map(n => n.tick)
                .filter(t => t >= 0 && t <= loop)
            return { loopLengthTick: loop, noteTicks, muted: isMuted }
        })
    }, [projections, trackStates])
    // CRDT はストアが常に最新を保持。UI は参照のみ。
    return <SequencerViz bpm={tick.bpm} tracksProjection={tracksProjection} />
}


