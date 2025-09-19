'use client'

import React from 'react'
import { Slider } from '@/components/ui/slider'

interface Props {
    value: number
    onChange: (v: number) => void
}

export function VerticalSlider({ value, onChange }: Props) {
    return (
        <div className="h-32 flex items-center">
            <Slider
                value={[value]}
                onValueChange={(v) => onChange(v[0] ?? 0)}
                max={100}
                step={1}
                orientation="vertical"
                className="h-32"
            />
        </div>
    )
}


