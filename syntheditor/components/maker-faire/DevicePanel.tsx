'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { useSynthevery } from '@/contexts/SyntheveryContext'
import { getAddressString } from '@/lib/synthevery-core/connection/util'
import { useAppState } from '@/hooks/useAppState'
import { useTrackConfig } from '@/hooks/useTrackConfig'
import useMesh from '@/hooks/useMesh'
import { APP_MAC_ADDRESS } from '@/lib/synthevery-core/connection/constants'
import { getAddressFromString } from '@/lib/synthevery-core/connection/util'
import { useDeviceColors } from '@/hooks/useDeviceColors'
import { InstrumentIcon } from '@/components/icons/InstrumentIcon'

export function DevicePanel() {
    const { playerSyncStates } = useSynthevery()
    const [currentTracks, setCurrentTracks] = useAppState(playerSyncStates.currentTracksState)
    const currentTracksRef = React.useRef(currentTracks)
    React.useEffect(() => {
        currentTracksRef.current = currentTracks
    }, [currentTracks])
    const { trackDetails, isReady } = useTrackConfig()

    // デバイス色取得フック
    const { getDeviceBodyColor, getDeviceLedColor, getDeviceLedStatus } = useDeviceColors()

    // useMeshフックからデバイス接続状態を取得
    const { connectedDevices, connectedPeers } = useMesh()

    // デバウンス用のタイマー保持（デバイスごと）
    const trackUpdateTimers = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

    // デバウンス付きのトラック設定
    const setTrackDebounced = (mac: string, index: number, delayMs: number = 500) => {
        const timers = trackUpdateTimers.current
        const existing = timers.get(mac)
        if (existing) {
            clearTimeout(existing)
        }
        const timer = setTimeout(() => {
            const base = currentTracksRef.current as Map<string, number>
            const next = new Map(base)
            next.set(mac, index)
            setCurrentTracks(next)
            timers.delete(mac)
        }, delayMs)
        timers.set(mac, timer)
    }

    // アンマウント時にタイマーをクリア
    React.useEffect(() => {
        return () => {
            for (const t of trackUpdateTimers.current.values()) {
                clearTimeout(t)
            }
            trackUpdateTimers.current.clear()
        }
    }, [])

    // 重複を除去してすべてのデバイスを取得し、アプリアドレスを除外
    const allDevices = [...connectedPeers, ...connectedDevices]
    const uniqueDevices = allDevices.filter((macStr, index, self) => {
        // 重複除去
        const isUnique = index === self.findIndex(d => d === macStr)
        // アプリアドレス除外
        const isNotAppAddress = macStr !== getAddressString({ address: APP_MAC_ADDRESS })
        return isUnique && isNotAppAddress
    })

    // MACアドレスの文字列で昇順に固定
    const sortedDevices = [...uniqueDevices].sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()))

    const setTrack = (mac: string, index: number) => {
        setTrackDebounced(mac, index)
    }

    const changeTrack = (mac: string, direction: 'prev' | 'next') => {
        const currentIndex = currentTracks.get(mac) ?? 0
        const newIndex = direction === 'next'
            ? (currentIndex + 1) % 8
            : (currentIndex + 7) % 8 // +7 is equivalent to -1 mod 8
        setTrack(mac, newIndex)
    }

    console.log('DevicePanel - Connected peers:', connectedPeers.length, connectedPeers)
    console.log('DevicePanel - Connected devices:', connectedDevices.length, connectedDevices)
    console.log('DevicePanel - All unique devices (excluding app address):', uniqueDevices.length, uniqueDevices)
    console.log('DevicePanel - App address:', getAddressString({ address: APP_MAC_ADDRESS }))

    return (
        <div className="flex gap-4 overflow-x-auto">
            {uniqueDevices.length === 0 && (
                <div className="text-sm text-muted-foreground">No devices connected</div>
            )}
            {sortedDevices.map((macStr) => {
                const trackIndex = currentTracks.get(macStr) ?? 0
                const deviceAddr = getAddressFromString(macStr)
                const bodyColor = getDeviceBodyColor(deviceAddr)
                const ledColor = getDeviceLedColor(deviceAddr)
                const ledStatus = getDeviceLedStatus(deviceAddr)
                return (
                    <Popover key={macStr} modal={true}>
                        <PopoverTrigger className="w-56 h-full p-3 cursor-pointer flex flex-col justify-between items-center hover:bg-accent/50 transition-colors rounded-lg border bg-card">
                            <div className="flex items-center justify-between w-full">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        changeTrack(macStr, 'prev')
                                    }}
                                >
                                    ‹
                                </Button>
                                <div className="flex flex-col items-center gap-2">
                                    <svg width="40" height="64">
                                        <rect x="4" y="2" width="32" height="60" rx="4" fill={bodyColor} />
                                        <circle cx="20" cy="32" r="8" fill={ledColor} />
                                    </svg>
                                    <div className="text-sm">Track {trackIndex + 1}</div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        changeTrack(macStr, 'next')
                                    }}
                                >
                                    ›
                                </Button>
                            </div>
                            <div className="w-full flex flex-col items-center gap-2">
                                <div className="w-16 h-16 text-foreground/90">
                                    <InstrumentIcon
                                        icon={isReady && trackDetails[trackIndex] ? trackDetails[trackIndex].icon : 'piano'}
                                        className="w-full h-full"
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground text-center">
                                    {isReady && trackDetails[trackIndex]
                                        ? trackDetails[trackIndex].displayName
                                        : 'Piano'}
                                </div>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 z-50" side="top" align="center">
                            <div className="text-xs text-muted-foreground mb-2">{macStr}</div>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-sm mb-2">Tracks</div>
                                    <div className="grid grid-cols-1 gap-1 max-h-64 overflow-auto pr-1">
                                        {Array.from({ length: 8 }).map((_, i) => {
                                            const detail = isReady && trackDetails[i] ? trackDetails[i] : undefined
                                            const name = detail ? detail.displayName : `Track ${i + 1}`
                                            const icon = detail ? detail.icon : 'piano'
                                            const isCurrent = i === trackIndex
                                            return (
                                                <button
                                                    key={i}
                                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded border text-left ${isCurrent ? 'bg-accent/50 border-accent' : 'hover:bg-accent/30 border-transparent'}`}
                                                    onClick={() => setTrackDebounced(macStr, i, 0)}
                                                >
                                                    <div className="w-5 h-5 text-foreground/90">
                                                        <InstrumentIcon icon={icon} className="w-full h-full" />
                                                    </div>
                                                    <div className="flex-1 text-sm truncate">{name}</div>
                                                    {isCurrent && (
                                                        <div className="text-xs text-muted-foreground">selected</div>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm mb-1">Master Volume (UI only)</div>
                                    <Slider max={100} step={1} defaultValue={[80]} />
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                )
            })}
        </div>
    )
}


