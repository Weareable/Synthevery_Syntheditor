'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import useMesh from '@/hooks/useMesh'
import useTimeSync from '@/hooks/useTimeSync'

export default function Page() {
    const { connectedDevices, deviceOrder, connectDevice, isReady } = useMesh()
    const { startByString, isSyncing, lastOffsetUs, lastTarget, lastBaseOffsetUs, lastSamples, syncTime } = useTimeSync()
    const [currentMicros, setCurrentMicros] = useState<number | null>(null)

    const oldest = useMemo(() => deviceOrder[0] || null, [deviceOrder])

    const handleConnect = useCallback(async () => {
        await connectDevice()
    }, [connectDevice])

    const handleSync = useCallback(() => {
        if (!oldest) return
        startByString(oldest)
    }, [oldest, startByString])

    useEffect(() => {
        if (isReady && oldest) {
            startByString(oldest)
        }
    }, [isReady, oldest, startByString])

    useEffect(() => {
        // SSR との不一致を避けるため、マウント後にのみ時刻を更新
        let timer: ReturnType<typeof setInterval> | null = null
        const tick = () => setCurrentMicros(syncTime.micros())
        tick()
        timer = setInterval(tick, 250)
        return () => {
            if (timer) clearInterval(timer)
        }
    }, [syncTime])

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-bold">Time Sync Test</h1>
            <div>
                <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={handleConnect}>Connect</button>
            </div>
            <div>
                <div>Connected devices: {connectedDevices.length}</div>
                <div>Device order: {deviceOrder.join(', ')}</div>
                <div>Oldest: {oldest || '-'}</div>
            </div>
            <div className="space-x-2">
                <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={handleSync} disabled={!oldest || isSyncing}>
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
            </div>
            <div>
                <div>Last target: {lastTarget || '-'}</div>
                <div>Last base offset (us): {lastBaseOffsetUs ?? '-'}</div>
                <div>Last final offset (us): {lastOffsetUs ?? '-'}</div>
                <div>Current SyncTime micros(): <span suppressHydrationWarning>{currentMicros ?? '-'}</span></div>
            </div>
            <div>
                <h2 className="text-lg font-semibold mt-4">Samples</h2>
                <table className="text-sm w-full border mt-2">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border px-2 py-1">#</th>
                            <th className="border px-2 py-1">t0</th>
                            <th className="border px-2 py-1">t1</th>
                            <th className="border px-2 py-1">t2</th>
                            <th className="border px-2 py-1">t3</th>
                            <th className="border px-2 py-1">(t1-t0)</th>
                            <th className="border px-2 py-1">(t2-t3)</th>
                            <th className="border px-2 py-1">offset_i</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lastSamples.map((s, i) => {
                            const d1 = (s.t1 >>> 0) - (s.t0 >>> 0)
                            const d2 = (s.t2 >>> 0) - (s.t3 >>> 0)
                            const oi = Math.trunc((d1 + d2) / 2)
                            return (
                                <tr key={i}>
                                    <td className="border px-2 py-1">{i}</td>
                                    <td className="border px-2 py-1">{s.t0}</td>
                                    <td className="border px-2 py-1">{s.t1}</td>
                                    <td className="border px-2 py-1">{s.t2}</td>
                                    <td className="border px-2 py-1">{s.t3}</td>
                                    <td className="border px-2 py-1">{d1}</td>
                                    <td className="border px-2 py-1">{d2}</td>
                                    <td className="border px-2 py-1">{oi}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}


