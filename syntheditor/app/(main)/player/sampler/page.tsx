'use client'
import React from 'react'

export default function SamplerPage() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-200">
            <div className="text-4xl mb-6">🎵</div>
            <div className="text-2xl mb-4">サンプラー</div>
            <div className="text-zinc-400">サンプル音源を操作</div>
            <div className="mt-8 grid grid-cols-4 gap-4">
                {Array.from({ length: 16 }, (_, i) => (
                    <button
                        key={i}
                        className="w-20 h-20 bg-zinc-700 border border-zinc-600 rounded-lg hover:bg-zinc-600 transition-colors flex flex-col items-center justify-center"
                    >
                        <div className="text-xs text-zinc-400 mb-1">PAD</div>
                        <div className="text-lg font-bold">{i + 1}</div>
                    </button>
                ))}
            </div>
            <div className="mt-8 flex gap-4">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors">
                    録音
                </button>
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors">
                    再生
                </button>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors">
                    停止
                </button>
            </div>
        </div>
    )
} 