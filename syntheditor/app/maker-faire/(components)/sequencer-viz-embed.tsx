'use client'

import React from 'react'
import { SequencerViz } from '@/components/maker-faire/SequencerViz'
import { useSynthevery } from '@/contexts/SyntheveryContext'
import { useReadOnlyAppState } from '@/hooks/useAppState'

export function SequencerVizEmbed() {
    const { playerSyncStates } = useSynthevery()
    const tick = useReadOnlyAppState(playerSyncStates.tickClockState)
    return <SequencerViz bpm={tick.bpm} />
}


