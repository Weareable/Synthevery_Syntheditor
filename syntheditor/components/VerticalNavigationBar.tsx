import React from 'react'

export function VerticalNavigationBar() {
    return (
        <nav className="flex flex-col gap-4 items-center mt-4">
            <button className="w-10 h-10 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">A</button>
            <button className="w-10 h-10 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">B</button>
            <button className="w-10 h-10 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">C</button>
            <button className="w-10 h-10 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">D</button>
        </nav>
    )
} 