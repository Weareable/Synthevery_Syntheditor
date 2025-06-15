'use client'
import React from 'react'
import { ToggleButton } from '@/components/ui/toggle-button'

export default function SynthesizerPage() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-200">
            <div className="text-4xl mb-6">🎹</div>
            <div className="text-2xl mb-4">シンセサイザー</div>
            <div className="text-zinc-400 mb-8">メロディとハーモニーを作成</div>

            <div className="mb-8">
                <div className="text-sm mb-2 text-zinc-400">ミュート</div>
                <ToggleButton
                    label="M"
                    defaultActive={false}
                    onToggle={(isActive) => console.log('Mute:', isActive)}
                />
            </div>

            <div className="grid grid-cols-8 gap-2">
                {Array.from({ length: 16 }, (_, i) => (
                    <button
                        key={i}
                        className="w-12 h-20 bg-zinc-700 border border-zinc-600 rounded hover:bg-zinc-600 transition-colors"
                    >
                    </button>
                ))}
            </div>
        </div>
    )
} 