"use client"
import React, { useMemo, useState } from 'react'
import { useSynthevery } from '@/contexts/SyntheveryContext'

export function InstrumentPicker({ trackIndex }: { trackIndex: number }) {
    const { instrumentRepository, instrumentService } = useSynthevery()
    const [q, setQ] = useState('')
    const list = useMemo(() => instrumentRepository.search(q), [instrumentRepository, q])

    return (
        <div className="flex flex-col gap-2">
            <input
                className="border rounded px-2 py-1 text-sm"
                placeholder="Search instrument"
                value={q}
                onChange={(e) => setQ(e.target.value)}
            />
            <div className="max-h-64 overflow-auto border rounded">
                {list.map(p => (
                    <button
                        key={p.id}
                        className="w-full text-left px-2 py-1 hover:bg-accent/50 text-sm"
                        onClick={() => instrumentService.setInstrument(trackIndex, p.id)}
                        title={p.description || p.displayName}
                    >
                        {p.icon ? <span className="mr-2">[{p.icon}]</span> : null}
                        {p.displayName}
                    </button>
                ))}
                {list.length === 0 && (
                    <div className="px-2 py-3 text-xs text-muted-foreground">No results</div>
                )}
            </div>
        </div>
    )
}


