'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Panel } from '@/components/ui/panel'

const navigationItems = [
    { href: '/player/tracks', icon: '🎼', label: 'トラック選択' },
    { href: '/player/devices', icon: '📱', label: 'デバイス管理' },
    { href: '/player/synthesizer', icon: '🎹', label: 'シンセサイザー' },
    { href: '/player/drums', icon: '🥁', label: 'ドラムス' },
    { href: '/player/bass', icon: '🎸', label: 'ベース' },
    { href: '/player/sampler', icon: '🎵', label: 'サンプラー' },
    { href: '/player/sequencer', icon: '🎯', label: 'シーケンサー' }
]

export function VerticalNavigationBar() {
    const pathname = usePathname()

    return (
        <Panel className="flex-col h-full p-2 gap-2">
            {navigationItems.map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`w-10 h-10 rounded border flex items-center justify-center text-lg transition-colors ${isActive
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                            }`}
                        title={item.label}
                    >
                        {item.icon}
                    </Link>
                )
            })}
        </Panel>
    )
} 