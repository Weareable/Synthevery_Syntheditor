'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTrackConfig } from '@/hooks/useTrackConfig'
import { InstrumentIcon } from '@/components/icons/InstrumentIcon'
import useDeviceControl from '@/hooks/useDeviceControl'

interface TrackToggleCardProps {
    trackNumber: number
    isMuted: boolean
    onToggle: () => void
    className?: string
}

export function TrackToggleCard({ trackNumber, isMuted, onToggle, className }: TrackToggleCardProps) {
    const { trackDetails, isReady } = useTrackConfig()
    const { resetTrack } = useDeviceControl()

    const detail = isReady && trackDetails[trackNumber - 1] ? trackDetails[trackNumber - 1] : undefined
    const instrumentName = detail ? detail.displayName : 'Piano'
    const instrumentIcon = detail ? detail.icon : 'piano'

    return (
        <div
            className={cn(
                'h-full w-full flex flex-col p-4 gap-2',
                isMuted ? 'opacity-50' : '',
                className
            )}
        >
            <div
                className={cn(
                    'flex-1 w-full flex flex-col items-center justify-center gap-2 rounded-md',
                    'cursor-pointer hover:bg-accent/50'
                )}
                onClick={onToggle}
            >
                <div className="w-10 h-10 text-foreground/90">
                    <InstrumentIcon icon={instrumentIcon} className="w-full h-full" />
                </div>
                <div className="text-sm font-medium">Track {trackNumber}</div>
                <div className="text-xs text-muted-foreground text-center">
                    {instrumentName}
                </div>
                <div className="text-xs">
                    {isMuted ? 'Muted' : 'Active'}
                </div>
            </div>
            <div className="pt-2">
                <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={(e) => { e.stopPropagation(); resetTrack(trackNumber) }}
                >
                    Clear Sequence
                </Button>
            </div>
        </div>
    )
}
