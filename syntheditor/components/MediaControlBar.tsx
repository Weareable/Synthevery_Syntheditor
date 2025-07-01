'use client'

import React, { useState } from 'react'
import { Panel } from '@/components/ui/panel'
import { OneshotButton } from '@/components/ui/oneshot-button'
import { ToggleButton } from '@/components/ui/toggle-button'
import { VerticalDivider } from '@/components/ui/vertical-divider'
import { PlayingToggleButton } from '@/components/ui/playing-toggle-button'
import { StopIcon, RecordIcon } from '@/components/icons/media'
import { UndoIcon, RedoIcon } from '@/components/icons/control'
import BPMInput from './ui/bpm-input'

export function MediaControlBar() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isQActive, setIsQActive] = useState(false);
    const [isMActive, setIsMActive] = useState(false);

    return (
        <Panel className="flex gap-2 items-center p-2 w-full justify-center">
            <div className="flex gap-2 items-center">
                <ToggleButton
                    size="default"
                    pressed={isQActive}
                    onPressedChange={setIsQActive}
                >
                    Q
                </ToggleButton>
                <ToggleButton
                    size="default"
                    pressed={isMActive}
                    onPressedChange={setIsMActive}
                >
                    M
                </ToggleButton>
                <BPMInput />
            </div>
            <VerticalDivider variant="background" size="lg" />
            <div className="flex gap-2 items-center">
                <PlayingToggleButton isPlaying={isPlaying} onChange={setIsPlaying} />
                <OneshotButton
                    variant="default"
                    size="default"
                    onClick={() => console.log('OneshotButton clicked!')}
                >
                    <StopIcon width={10} height={10} strokeWidth={2} />
                </OneshotButton>
            </div>
            <VerticalDivider variant="background" size="lg" />
            <div className="flex gap-2 items-center">
                <OneshotButton
                    variant="default"
                    size="default"
                    onClick={() => console.log('OneshotButton clicked!')}
                >
                    <UndoIcon width={10} height={10} strokeWidth={2} />
                </OneshotButton>
                <ToggleButton
                    size="default"
                    pressed={isMActive}
                    onPressedChange={setIsMActive}
                >
                    <RecordIcon width={10} height={10} strokeWidth={2} />
                </ToggleButton>
                <OneshotButton
                    variant="default"
                    size="default"
                    onClick={() => console.log('OneshotButton clicked!')}
                >
                    <RedoIcon width={10} height={10} strokeWidth={2} />
                </OneshotButton>
            </div>
        </Panel>
    )
} 