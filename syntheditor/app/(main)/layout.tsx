'use client'
import { VerticalNavigationBar } from '@/components/VerticalNavigationBar'
import { DeviceStatusPanel } from '@/components/DeviceStatusPanel'
import { MediaControlBar } from '@/components/MediaControlBar'
import { ReconnectModal } from '@/components/ui/reconnect-modal'
import useMesh from '@/hooks/useMesh'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { connectedDevices, connectDevice } = useMesh()
    const [isReconnectModalOpen, setIsReconnectModalOpen] = useState(false)
    const [isReconnecting, setIsReconnecting] = useState(false)

    // デバイスが完全に切断されたかチェック
    const isDisconnected = connectedDevices.length === 0

    // デバイス切断時にモーダルを表示
    useEffect(() => {
        if (isDisconnected) {
            setIsReconnectModalOpen(true)
        }
    }, [isDisconnected])

    const handleReconnect = async () => {
        setIsReconnecting(true)
        try {
            await connectDevice()
        } catch (error) {
            console.error('Reconnection failed:', error)
        } finally {
            setIsReconnecting(false)
            setIsReconnectModalOpen(false)
        }
    }

    const handleCloseModal = () => {
        // connectページに遷移
        router.push('/connect')
    }

    return (
        <>
            <div className={`flex flex-col h-screen bg-background gap-2 p-2 ${isDisconnected ? 'pointer-events-none opacity-50' : ''}`}>
                <div className="flex flex-1 overflow-hidden gap-2">
                    {/* 左ナビゲーションバー */}
                    <aside className="flex-none justify-center">
                        <VerticalNavigationBar />
                    </aside>
                    {/* メイン表示領域 */}
                    <main className="flex-1 overflow-auto bg-zinc-800 flex items-center justify-center">
                        {children}
                    </main>
                    {/* デバイスステータス領域 */}
                    <aside className="w-64 bg-zinc-900 border-l border-zinc-700 flex flex-col items-center py-2">
                        <DeviceStatusPanel />
                    </aside>
                </div>
                {/* メディアコントロールバー */}
                <footer className="flex-none bg-background flex items-center justify-center">
                    <MediaControlBar />
                </footer>
            </div>

            {/* デバイス切断時のモーダル */}
            <ReconnectModal
                isOpen={isReconnectModalOpen}
                onClose={handleCloseModal}
                onReconnect={handleReconnect}
                deviceName={null}
            />
        </>
    )
}