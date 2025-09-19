'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface DeviceConnectionModalProps {
    isOpen: boolean
    onClose: () => void
    onConnect: () => Promise<void>
    isConnecting?: boolean
}

export function DeviceConnectionModal({ isOpen, onClose, onConnect, isConnecting = false }: DeviceConnectionModalProps) {
    const handleConnect = async () => {
        try {
            await onConnect()
            onClose()
        } catch (error) {
            console.error('Connection failed:', error)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md [&>button]:hidden">
                <DialogHeader className="text-center">
                    <div className="text-4xl mb-4">🎵</div>
                    <DialogTitle>デバイス接続が必要です</DialogTitle>
                    <DialogDescription>
                        Syntheveryデバイスを接続して、音楽制作を始めましょう
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        • デバイスの電源を入れる<br />
                        • Bluetoothを有効にする<br />
                        • デバイスを検出して接続する
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="w-full"
                        >
                            {isConnecting ? '接続中...' : 'デバイスを検索'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
