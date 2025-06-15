'use client'
import React from 'react'
import { ToggleButton } from '@/components/ui/ToggleButton'

export default function DrumsPage() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-200">
            <div className="text-4xl mb-6">🥁</div>
            <div className="text-2xl mb-4">ドラムス</div>
            <div className="text-zinc-400 mb-8">リズムとビートを作成</div>

            <div className="mb-8 flex gap-6">
                <div>
                    <div className="text-sm mb-2 text-zinc-400">ミュート</div>
                    <ToggleButton
                        label="M"
                        defaultActive={false}
                        onToggle={(isActive) => console.log('Mute:', isActive)}
                    />
                </div>
                <div>
                    <div className="text-sm mb-2 text-zinc-400">ソロ</div>
                    <ToggleButton
                        label="S"
                        defaultActive={false}
                        onToggle={(isActive) => console.log('Solo:', isActive)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                {[
                    { name: 'Kick', icon: '🦶' },
                    { name: 'Snare', icon: '🥁' },
                    { name: 'Hi-Hat', icon: '🎩' },
                    { name: 'Crash', icon: '💥' },
                    { name: 'Tom', icon: '🎯' },
                    { name: 'Ride', icon: '🏇' },
                    { name: 'Clap', icon: '👏' },
                    { name: 'Perc', icon: '🔔' }
                ].map((drum, i) => (
                    <button
                        key={i}
                        className="w-20 h-20 bg-zinc-700 border border-zinc-600 rounded-lg hover:bg-zinc-600 transition-colors flex flex-col items-center justify-center text-sm"
                    >
                        <div className="text-lg mb-1">{drum.icon}</div>
                        <div>{drum.name}</div>
                    </button>
                ))}
            </div>
        </div>
    )
} 