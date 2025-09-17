'use client'
import React from 'react'

export default function BassPage() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-200">
            <div className="text-4xl mb-6">🎸</div>
            <div className="text-2xl mb-4">ベース</div>
            <div className="text-zinc-400">低音の基盤を作成</div>
            <div className="mt-8 flex flex-col gap-4">
                {['E', 'A', 'D', 'G'].map((string, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="w-8 text-center font-bold text-zinc-300">{string}</div>
                        <div className="flex gap-1">
                            {Array.from({ length: 12 }, (_, fret) => (
                                <button
                                    key={fret}
                                    className="w-8 h-8 bg-zinc-700 border border-zinc-600 rounded hover:bg-zinc-600 transition-colors text-xs"
                                >
                                    {fret || ''}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
} 