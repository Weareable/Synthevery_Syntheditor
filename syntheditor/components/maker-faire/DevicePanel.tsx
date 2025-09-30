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
import { APP_MAC_ADDRESS } from '@/lib/synthevery-core/connection/constants'

export function DevicePanel() {
    const { mesh, playerSyncStates } = useSynthevery()
    const [currentTracks, setCurrentTracks] = useAppState(playerSyncStates.currentTracksState)
    const { trackDetails, isReady } = useTrackConfig()

    // 直接接続デバイス（connectedPeers）とメッシュ経由デバイス（connectedDevices）の両方を取得
    const connectedPeers = mesh.getConnectedPeers?.() ?? []
    const connectedDevices = mesh.getConnectedDevices?.() ?? []

    // 重複を除去してすべてのデバイスを取得し、アプリアドレスを除外
    const allDevices = [...connectedPeers, ...connectedDevices]
    const uniqueDevices = allDevices.filter((device, index, self) => {
        // 重複除去
        const isUnique = index === self.findIndex(d => getAddressString(d) === getAddressString(device))
        // アプリアドレス除外
        const isNotAppAddress = getAddressString(device) !== getAddressString({ address: APP_MAC_ADDRESS })
        return isUnique && isNotAppAddress
    })

    const setTrack = (mac: string, index: number) => {
        const next = new Map(currentTracks)
        next.set(mac, index)
        setCurrentTracks(next)
    }

    const changeTrack = (mac: string, direction: 'prev' | 'next') => {
        const currentIndex = currentTracks.get(mac) ?? 0
        const newIndex = direction === 'next'
            ? (currentIndex + 1) % 8
            : (currentIndex + 7) % 8 // +7 is equivalent to -1 mod 8
        setTrack(mac, newIndex)
    }

    console.log('DevicePanel - Connected peers:', connectedPeers.length, connectedPeers.map(p => getAddressString(p)))
    console.log('DevicePanel - Connected devices:', connectedDevices.length, connectedDevices.map(p => getAddressString(p)))
    console.log('DevicePanel - All unique devices (excluding app address):', uniqueDevices.length, uniqueDevices.map(p => getAddressString(p)))
    console.log('DevicePanel - App address:', getAddressString({ address: APP_MAC_ADDRESS }))

    return (
        <div className="flex gap-4 overflow-x-auto">
            {uniqueDevices.length === 0 && (
                <div className="text-sm text-muted-foreground">No devices connected</div>
            )}
            {uniqueDevices.map((mac) => {
                const macStr = getAddressString(mac)
                const trackIndex = currentTracks.get(macStr) ?? 0
                return (
                    <Popover key={macStr} modal={true}>
                        <PopoverTrigger className="w-56 h-full p-3 cursor-pointer grid gap-2 place-items-center hover:bg-accent/50 transition-colors rounded-lg border bg-card">
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
                                        <rect x="4" y="2" width="32" height="60" rx="4" fill="#64748b" />
                                        <circle cx="20" cy="32" r="8" fill="#e11d48" />
                                    </svg>
                                    <div className="text-sm">Track {trackIndex + 1}</div>
                                    <div className="text-xs text-muted-foreground text-center">
                                        {isReady && trackDetails[trackIndex]
                                            ? trackDetails[trackIndex].displayName
                                            : 'Piano'}
                                    </div>
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
                        </PopoverTrigger>
                        <PopoverContent className="w-64 z-50" side="top" align="center">
                            <div className="text-xs text-muted-foreground mb-2">{macStr}</div>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-sm mb-1">Selected Track</div>
                                    <Select value={String(trackIndex)} onValueChange={(v) => setTrack(macStr, Number(v))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 8 }).map((_, i) => (
                                                <SelectItem key={i} value={String(i)}>{i + 1}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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


