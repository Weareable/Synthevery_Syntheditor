import React from 'react'

export function DeviceStatusPanel() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-400">
            <div className="text-6xl mb-4">🤖</div>
            <div>デバイスステータス</div>
            <div className="mt-2 text-xs">（ここに情報が表示されます）</div>
        </div>
    )
} 