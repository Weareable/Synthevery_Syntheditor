import React from 'react'
import { Button } from './button'

interface ReconnectModalProps {
    isOpen: boolean
    onClose: () => void
    onReconnect: () => void
    deviceName?: string | null
}

export function ReconnectModal({ isOpen, onClose, onReconnect, deviceName }: ReconnectModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 max-w-md w-full mx-4">
                <div className="text-center">
                    <div className="text-4xl mb-4">🔌</div>
                    <h3 className="text-xl font-semibold text-zinc-200 mb-2">
                        デバイスが切断されました
                    </h3>
                    <p className="text-zinc-400 mb-6">
                        {deviceName ? `${deviceName}が` : 'デバイスが'}切断されました。
                        再接続しますか？
                    </p>

                    <div className="flex gap-3 justify-center">
                        <Button
                            onClick={onReconnect}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            再接続
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                        >
                            終了
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
} 