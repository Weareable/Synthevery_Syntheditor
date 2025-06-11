import React from 'react'

export function MediaControlBar() {
    return (
        <div className="flex gap-4 items-center">
            <button className="w-12 h-12 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">Q</button>
            <button className="w-12 h-12 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">M</button>
            <div className="px-4 py-2 bg-zinc-700 rounded text-zinc-200">BPM 120.0</div>
            <button className="w-12 h-12 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">▶</button>
            <button className="w-12 h-12 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">■</button>
            <button className="w-12 h-12 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">⟳</button>
            <button className="w-12 h-12 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">●</button>
            <button className="w-12 h-12 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">⏩</button>
        </div>
    )
} 