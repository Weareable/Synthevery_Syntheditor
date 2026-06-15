'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
    { href: '/maker-faire', label: 'Dashboard' },
    { href: '/maker-faire/instruments', label: 'Instruments' },
    { href: '/maker-faire/chord', label: 'Chord' },
    { href: '/maker-faire/devices', label: 'Devices' },
    { href: '/maker-faire/settings', label: 'Settings' },
]

export function SidebarNav() {
    const pathname = usePathname()
    return (
        <nav aria-label="Main navigation" className="h-full overflow-y-auto p-2">
            <ul className="flex flex-col gap-1">
                {links.map((l) => {
                    const active = pathname === l.href
                    return (
                        <li key={l.href}>
                            <Link
                                href={l.href}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'block rounded px-4 py-2 text-sm transition-colors',
                                    active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60'
                                )}
                            >
                                {l.label}
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}


