'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTrackConfig } from '@/hooks/useTrackConfig'

interface TrackToggleCardProps {
    trackNumber: number
    isMuted: boolean
    onToggle: () => void
    className?: string
}

export function TrackToggleCard({ trackNumber, isMuted, onToggle, className }: TrackToggleCardProps) {
    const { trackDetails, isReady } = useTrackConfig()

    const instrumentName = isReady && trackDetails[trackNumber - 1]
        ? trackDetails[trackNumber - 1].displayName
        : 'Piano'

    return (
        <Button
            variant={isMuted ? 'secondary' : 'default'}
            onClick={onToggle}
            className={cn(
                'h-full w-full flex flex-col items-center justify-center gap-2 p-4',
                isMuted ? 'opacity-50' : '',
                className
            )}
        >
            <div className="text-sm font-medium">Track {trackNumber}</div>
            <div className="text-xs text-muted-foreground text-center">
                {instrumentName}
            </div>
            <div className="text-xs">
                {isMuted ? 'Muted' : 'Active'}
            </div>
        </Button>
    )
}
