'use client'

import { useEffect, useState } from 'react'
import { syntheveryServiceContainer } from '../../service-container'
import type { InstrumentPreset } from '../../types/player'

export function useInstrumentPresets() {
    const [presets, setPresets] = useState<InstrumentPreset[]>([])

    useEffect(() => {
        const services = syntheveryServiceContainer.getServices()
        const repo = services.instrumentRepository
        const reload = () => setPresets(repo.list())
        reload()
        const onChange = () => reload()
        repo.eventEmitter.on('change', onChange)
        return () => { repo.eventEmitter.off('change', onChange) }
    }, [])

    const reload = () => {
        const services = syntheveryServiceContainer.getServices()
        setPresets(services.instrumentRepository.list())
    }

    return { presets, reload }
}


