import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSynthevery } from '@/contexts/SyntheveryContext'
import { TickClockFollower } from '@/lib/synthevery-core/player/tick-clock'

export default function useTickClock() {
    const { timeSyncService, playerSyncStates } = useSynthevery()
    const tickClock = useRef<TickClockFollower | null>(null)
    const [tick, setTick] = useState(0)
    const [isRunning, setIsRunning] = useState(false)
    const [bpm, setBpm] = useState(120)

    // 初期化: SyncTime を使って TickClockFollower を生成
    useEffect(() => {
        tickClock.current = new TickClockFollower(timeSyncService.syncTime, 120, 480)
        return () => {
            tickClock.current = null
        }
    }, [timeSyncService])

    // AppState の購読: 受信都度、フォロワへ反映
    useEffect(() => {
        const sync = playerSyncStates.tickClockState
        const onSynced = () => {
            const v = sync.getStore().value
            if (!tickClock.current) return
            tickClock.current.setState({
                isRunning: v.playing,
                beatPerMinute: v.bpm,
                originTimeUs: (v as any).originTimeUs ?? 0,
                ticksPerBeat: 480,
            })
            if (v.playing) tickClock.current.start(); else tickClock.current.pause()
            setIsRunning(v.playing)
            setBpm(v.bpm)
        }
        sync.eventEmitter.on('synced', onSynced)
        // 初期値反映
        onSynced()
        return () => { sync.eventEmitter.off('synced', onSynced) }
    }, [playerSyncStates])

    // 描画更新: requestAnimationFrame で tick を更新
    useEffect(() => {
        let raf: number | null = null
        const loop = () => {
            if (tickClock.current) {
                setTick(tickClock.current.getTick())
            }
            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => { if (raf) cancelAnimationFrame(raf) }
    }, [])

    return { tick, isRunning, bpm }
}



