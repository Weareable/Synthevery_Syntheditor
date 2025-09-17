'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useMesh from '@/hooks/useMesh'
import useTickClock from '@/hooks/useTickClock'
import { useSynthevery } from '@/contexts/SyntheveryContext'
import { useAppState, useReadOnlyAppState } from '@/hooks/useAppState'
import useDeviceControl from '@/hooks/useDeviceControl'
import useTimeSync from '@/hooks/useTimeSync'

export default function Page() {
    const { connectedDevices, deviceOrder, connectDevice, isReady } = useMesh()
    const { playerSyncStates, timeSyncService, mesh } = useSynthevery()
    const { isSyncing, lastTarget, lastOffsetUs, lastBaseOffsetUs, lastSamples } = useTimeSync()
    const { setPlayingState, setBpmState, stop } = useDeviceControl()
    const tickClockState = useReadOnlyAppState(playerSyncStates.tickClockState)
    const [isMetronomeOn, setIsMetronomeOn] = useAppState(playerSyncStates.metronomeState)
    const { tick, isRunning, bpm } = useTickClock()

    const [currentTick, setCurrentTick] = useState(0)
    const [currentStep, setCurrentStep] = useState(0)

    const oldest = useMemo(() => deviceOrder[0] || null, [deviceOrder])

    // BPM 入力のローカル状態とデバウンス
    const [localBpm, setLocalBpm] = useState(tickClockState.bpm)
    useEffect(() => { setLocalBpm(tickClockState.bpm) }, [tickClockState.bpm])
    const debounceRef = useRef<NodeJS.Timeout | null>(null)
    const debouncedSetBpm = useCallback((value: number) => {
        setLocalBpm(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => setBpmState(value), 400)
    }, [setBpmState])

    useEffect(() => {
        // tick の変化に合わせて即時再計算
        const ticksPerBeat = 480
        const beatsPerLoop = 4
        const ticksPerLoop = ticksPerBeat * beatsPerLoop
        const wrapped = Math.floor(tick % ticksPerLoop)
        const step = Math.floor((wrapped / ticksPerLoop) * 32)
        setCurrentTick(wrapped)
        setCurrentStep(step)
    }, [tick])

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
                <button
                    className="px-3 py-1 rounded bg-primary text-primary-foreground"
                    onClick={() => connectDevice()}
                >
                    Connect
                </button>
                <button
                    className="px-3 py-1 rounded bg-secondary text-secondary-foreground"
                    onClick={() => {
                        const order = mesh.getDeviceOrder()
                        if (order.length === 0) return
                        timeSyncService.start(order[0])
                    }}
                >Resync Time</button>
                <span className="text-sm text-muted-foreground">Ready: {String(isReady)}</span>
                <span className="text-sm text-muted-foreground">Peers: {connectedDevices.length}</span>
                <span className="text-sm text-muted-foreground">Oldest: {oldest ?? '-'}</span>
            </div>

            <div className="p-3 rounded border bg-card text-card-foreground space-y-1">
                <div className="font-semibold">AppState (received)</div>
                <div>BPM: {tickClockState.bpm}</div>
                <div>Playing: {String(tickClockState.playing)}</div>
                <div>originTimeUs: {(tickClockState as any).originTimeUs ?? 0}</div>
            </div>

            <div className="p-3 rounded border bg-card text-card-foreground space-y-1">
                <div className="font-semibold">TimeSync</div>
                <div>Syncing: {String(isSyncing)}</div>
                <div>Last Target: {lastTarget ?? '-'}</div>
                <div>Last Base Offset (us): {lastBaseOffsetUs ?? '-'}</div>
                <div>Final Offset (us): {lastOffsetUs ?? '-'}</div>
                <div>Samples: {lastSamples.length}</div>
            </div>

            <div className="p-3 rounded border bg-card text-card-foreground space-y-1">
                <div className="font-semibold">TickClock (follower)</div>
                <div>Running: {String(isRunning)}</div>
                <div>Follower BPM: {bpm}</div>
                <div>Raw Tick: {Math.floor(tick)}</div>
                <div>Current Tick (loop-wrapped, 4 beats @ 480 TPB): {currentTick}</div>
                <div>Current Step (32 steps): {currentStep}</div>
                <div className="h-2 bg-muted rounded">
                    <div
                        className="h-2 bg-primary rounded"
                        style={{ width: `${(currentStep / 31) * 100}%` }}
                    />
                </div>
                <div className="flex gap-2 items-center mt-3">
                    <button
                        className="px-3 py-1 rounded bg-secondary text-secondary-foreground"
                        onClick={() => setPlayingState(true)}
                    >Play</button>
                    <button
                        className="px-3 py-1 rounded bg-secondary text-secondary-foreground"
                        onClick={() => setPlayingState(false)}
                    >Pause</button>
                    <button
                        className="px-3 py-1 rounded bg-secondary text-secondary-foreground"
                        onClick={() => stop()}
                    >Stop</button>
                    <label className="ml-4 text-sm">BPM:</label>
                    <input
                        className="px-2 py-1 rounded border bg-background"
                        type="number"
                        min={10}
                        max={500}
                        value={localBpm}
                        onChange={(e) => debouncedSetBpm(Number(e.target.value))}
                        style={{ width: 80 }}
                    />
                    <button
                        className="px-2 py-1 rounded border"
                        onClick={() => debouncedSetBpm(localBpm + 1)}
                    >+</button>
                    <button
                        className="px-2 py-1 rounded border"
                        onClick={() => debouncedSetBpm(localBpm - 1)}
                    >-</button>
                    <label className="ml-4 text-sm">Metronome: {isMetronomeOn ? 'On' : 'Off'}</label>
                    <button
                        className="px-3 py-1 rounded bg-secondary text-secondary-foreground"
                        onClick={() => setIsMetronomeOn(!isMetronomeOn)}
                    >Toggle</button>
                </div>
            </div>
        </div>
    )
}


