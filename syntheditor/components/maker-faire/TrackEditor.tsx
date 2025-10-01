'use client'

import React, { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useSynthevery } from '@/contexts/SyntheveryContext'
import { useAppState } from '@/hooks/useAppState'
import useDeviceControl from '@/hooks/useDeviceControl'
import { Button } from '@/components/ui/button'

const LOOP_OPTIONS = [4, 8, 16, 32, 64] // steps of 1/16 notes

export function TrackEditor() {
    const { playerSyncStates } = useSynthevery()
    const [trackStates, setTrackStates] = useAppState(playerSyncStates.trackStates)
    const [selected, setSelected] = useState(0)
    const { resetTrack } = useDeviceControl()

    const ts = trackStates[selected]

    const setLoop = (steps16: number) => {
        const next = trackStates.slice()
        next[selected] = { ...ts, loopLengthTick: steps16 * 120 }
        setTrackStates(next)
    }
    const setVolume = (v: number) => {
        const next = trackStates.slice()
        next[selected] = { ...ts, volume: Math.max(0, Math.min(100, Math.floor(v))) }
        setTrackStates(next)
    }
    const setMute = (m: boolean) => {
        const next = trackStates.slice()
        next[selected] = { ...ts, mute: m }
        setTrackStates(next)
    }
    const handleClearSequence = () => {
        resetTrack(selected + 1) // resetTrack expects 1-based track index
    }

    return (
        <div className="flex gap-4 h-full">
            <Card className="p-4 w-56 h-full">
                <Label className="text-sm mb-2 block">Track</Label>
                <Select value={String(selected)} onValueChange={(v) => setSelected(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <SelectItem key={i} value={String(i)}>{i + 1}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Card>
            <Card className="p-4 flex-1 grid grid-cols-2 gap-6 items-start">
                <div>
                    <Label className="text-sm">Instrument</Label>
                    <div className="text-xs text-muted-foreground">将来追加（当面表示のみ）</div>
                </div>
                <div>
                    <Label className="text-sm">Loop Length (1/16)</Label>
                    <Select value={String(Math.round(ts.loopLengthTick / 120))} onValueChange={(v) => setLoop(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {LOOP_OPTIONS.map((s) => (
                                <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-sm">Volume</Label>
                    <Slider value={[ts.volume]} max={100} step={1} onValueChange={(v) => setVolume(v[0] ?? ts.volume)} />
                </div>
                <div>
                    <Label className="text-sm">Mute</Label>
                    <div className="flex items-center gap-2">
                        <Switch checked={ts.mute} onCheckedChange={setMute} />
                        <span className="text-sm text-muted-foreground">{ts.mute ? 'ON' : 'OFF'}</span>
                    </div>
                </div>
                <div className="col-span-2">
                    <Label className="text-sm">Sequence</Label>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleClearSequence}
                        className="mt-2"
                    >
                        Clear Track Sequence
                    </Button>
                </div>
            </Card>
        </div>
    )
}


