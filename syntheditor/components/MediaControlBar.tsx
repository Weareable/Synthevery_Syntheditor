'use client'

import React, { useState } from 'react'
import { Panel } from '@/components/ui/panel'
import { ToggleButton } from '@/components/ui/toggle-button'
import { VerticalDivider } from '@/components/ui/vertical-divider'
import { PlayingToggleButton } from '@/components/ui/playing-toggle-button'
import BPMInput from './ui/bpm-input'

export function MediaControlBar() {
    const [isPlaying, setIsPlaying] = useState(false);
    return (
        <Panel className="flex gap-2 items-center p-2 w-full justify-center">
            <div className="flex gap-2 items-center">
                <ToggleButton className="w-10 h-10" label="Q" defaultActive={false} onToggle={(isActive) => console.log('Q:', isActive)} />
                <ToggleButton className="w-10 h-10" label="M" defaultActive={false} onToggle={(isActive) => console.log('M:', isActive)} />
                <BPMInput />
            </div>
            <VerticalDivider variant="background" size="lg" />
            <div className="flex gap-2 items-center">
                <PlayingToggleButton isPlaying={isPlaying} onChange={setIsPlaying} className="w-10 h-10" />
            </div>
        </Panel>
    )
} 