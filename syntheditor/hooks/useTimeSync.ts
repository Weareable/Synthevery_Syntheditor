import { useCallback, useEffect, useState } from 'react'
import { useSynthevery } from '@/contexts/SyntheveryContext'
import { getAddressFromString } from '@/lib/synthevery-core/connection/util'
import { P2PMacAddress } from '@/lib/synthevery-core/types/mesh'

export default function useTimeSync() {
    const { timeSyncService, mesh } = useSynthevery()

    const [lastTarget, setLastTarget] = useState<string | null>(timeSyncService.lastTargetString)
    const [lastOffsetUs, setLastOffsetUs] = useState<number | null>(timeSyncService.lastOffsetUs)
    const [isSyncing, setIsSyncing] = useState(timeSyncService.isSyncing)
    const [lastBaseOffsetUs, setLastBaseOffsetUs] = useState<number | null>(timeSyncService.lastBaseOffsetUs)
    const [lastSamples, setLastSamples] = useState(timeSyncService.lastSamples)

    const start = useCallback((target: P2PMacAddress) => {
        if (!mesh.isAvailable(target)) {
            console.warn('useTimeSync.start(): target not available')
            return false
        }
        timeSyncService.start(target)
        return true
    }, [mesh, timeSyncService])

    const startByString = useCallback((mac: string) => start(getAddressFromString(mac)), [start])

    useEffect(() => {
        const fn = () => {
            setIsSyncing(timeSyncService.isSyncing)
            setLastTarget(timeSyncService.lastTargetString)
            setLastOffsetUs(timeSyncService.lastOffsetUs)
            setLastBaseOffsetUs(timeSyncService.lastBaseOffsetUs)
            setLastSamples(timeSyncService.lastSamples)
        }
        timeSyncService.eventEmitter.on('updated', fn)
        return () => {
            timeSyncService.eventEmitter.off('updated', fn)
        }
    }, [timeSyncService])

    return { baseTime: timeSyncService.base, syncTime: timeSyncService.syncTime, synchronizer: timeSyncService.synchronizer, node: timeSyncService.node, start, startByString, isSyncing, lastTarget, lastOffsetUs, lastBaseOffsetUs, lastSamples }
}


