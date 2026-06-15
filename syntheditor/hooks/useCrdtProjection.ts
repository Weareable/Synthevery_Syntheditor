import { useEffect, useMemo, useState } from 'react'
import { useSynthevery } from '@/contexts/SyntheveryContext'
import type { TrackProjection } from '@/lib/synthevery-core/crdt/projection-store'

export function useCrdtProjection() {
    const services = useSynthevery()
    const store = services.crdtProjectionStore
    const [version, setVersion] = useState(0)

    useEffect(() => {
        const onUpdate = () => setVersion(v => v + 1)
        store.eventEmitter.on('updated', onUpdate)
        return () => { store.eventEmitter.off('updated', onUpdate) }
    }, [store])

    const projections: TrackProjection[] = useMemo(() => {
        return store.getTrackProjections()
    }, [store, version])

    return { projections }
}


