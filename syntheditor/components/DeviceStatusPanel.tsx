'use client'

import React from 'react'
import useMesh from '@/hooks/useMesh'

export function DeviceStatusPanel() {
    const { connectedDevices, connectedPeers } = useMesh()

    return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-4">
            <div className="text-6xl mb-4">🤖</div>
            <div className="text-lg font-semibold mb-2">デバイスステータス</div>

            <div className="w-full space-y-4">
                <div className="text-center">
                    <div className="text-sm text-zinc-500 mb-1">接続済みデバイス</div>
                    <div className="text-lg font-mono">
                        {connectedDevices.length > 0 ? (
                            connectedDevices.map((device, index) => (
                                <div key={index} className="text-green-400">
                                    {device}
                                </div>
                            ))
                        ) : (
                            <div className="text-red-400">なし</div>
                        )}
                    </div>
                </div>

                <div className="text-center">
                    <div className="text-sm text-zinc-500 mb-1">接続状態</div>
                    <div className={`text-sm ${connectedDevices.length > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {connectedDevices.length > 0 ? '接続中' : '未接続'}
                    </div>
                </div>

                <div className="text-center">
                    <div className="text-sm text-zinc-500 mb-1">ピア接続</div>
                    <div className="text-sm text-zinc-400">
                        {connectedPeers.length}台
                    </div>
                </div>
            </div>
        </div>
    )
} 