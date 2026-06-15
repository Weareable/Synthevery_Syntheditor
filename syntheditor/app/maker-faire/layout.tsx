'use client'

import React, { useState, useEffect } from 'react'
import { SidebarNav } from '@/components/maker-faire/SidebarNav'
import { TransportBar } from '@/components/maker-faire/TransportBar'
import { SequencerVizEmbed } from './(components)/sequencer-viz-embed'
import { TrackPanel } from '@/components/maker-faire/TrackPanel'
import { DevicePanel } from '@/components/maker-faire/DevicePanel'
import { DeviceConnectionModal } from '@/components/maker-faire/DeviceConnectionModal'
import { useSynthevery } from '@/contexts/SyntheveryContext'

export default function MakerFaireLayout({ children }: { children: React.ReactNode }) {
    const { mesh, trackConfigManager } = useSynthevery() as any
    const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)
    // アプリ側コンフィグの変更で DevicePanel を含むUIを再描画
    const [appConfigRev, setAppConfigRev] = useState(0)

    // デバイス接続状態を監視
    useEffect(() => {
        const checkConnection = () => {
            const devices = mesh.getConnectedDevices?.() ?? []
            const isDisconnected = devices.length === 0

            console.log('MakerFaireLayout: checkConnection', {
                devicesCount: devices.length,
                devices: devices.map((d: { toString(): string }) => d.toString()),
                isDisconnected,
                currentModalState: isConnectionModalOpen
            })

            // デバイスが切断された場合は常にモーダルを表示
            if (isDisconnected) {
                console.log('MakerFaireLayout: Setting modal to open')
                setIsConnectionModalOpen(true)
            } else if (!isDisconnected) {
                // デバイスが接続された場合はモーダルを閉じる
                console.log('MakerFaireLayout: Setting modal to close')
                setIsConnectionModalOpen(false)
            }
        }

        // 初回チェック
        checkConnection()

        // 接続状態変更を監視
        const handleConnectionChange = (eventName: string) => {
            console.log('MakerFaireLayout: Event received', eventName)
            checkConnection()
        }

        const handleConnectedDevicesChanged = () => handleConnectionChange('connectedDevicesChanged')
        const handleConnected = () => handleConnectionChange('connected')
        const handleDisconnected = () => handleConnectionChange('disconnected')

        mesh.eventEmitter?.on('connectedDevicesChanged', handleConnectedDevicesChanged)
        mesh.eventEmitter?.on('connected', handleConnected)
        mesh.eventEmitter?.on('disconnected', handleDisconnected)

        return () => {
            mesh.eventEmitter?.off('connectedDevicesChanged', handleConnectedDevicesChanged)
            mesh.eventEmitter?.off('connected', handleConnected)
            mesh.eventEmitter?.off('disconnected', handleDisconnected)
        }
    }, [mesh])

    // TrackConfigManager のアプリ側設定変更イベントを監視して再描画
    useEffect(() => {
        if (!trackConfigManager?.eventEmitter) return
        const onAppConfigChanged = () => setAppConfigRev((n) => n + 1)
        trackConfigManager.eventEmitter.on('appConfigChanged', onAppConfigChanged)
        return () => {
            trackConfigManager.eventEmitter.off('appConfigChanged', onAppConfigChanged)
        }
    }, [trackConfigManager])

    const handleConnect = async () => {
        setIsConnecting(true)
        try {
            await mesh.connectDevice()
        } catch (error) {
            console.error('Connection failed:', error)
        } finally {
            setIsConnecting(false)
        }
    }

    return (
        <>
            <div className="flex h-[calc(100vh-0px)]">
                {/* Sidebar */}
                <aside className="w-56 border-r bg-card h-full">
                    <SidebarNav />
                </aside>

                {/* Main area */}
                <main className="flex-1 flex flex-col gap-4 p-4 min-h-0">
                    <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                        <section className="col-span-1 min-h-0 h-full rounded border bg-card p-2 flex flex-col">
                            {/* Sequencer visual */}
                            <div className="flex-1 rounded bg-background/50 mb-2" id="sequencer-canvas">
                                <SequencerVizEmbed />
                            </div>
                            {/* Controls at the bottom */}
                            <div className="h-20 flex-shrink-0">
                                <TransportBar />
                            </div>
                        </section>
                        <section className="col-span-1 min-h-0 h-full rounded border bg-card p-2">
                            <TrackPanel />
                        </section>
                    </div>
                    <section className="rounded border bg-card p-2 h-40 overflow-x-auto overflow-y-visible">
                        <DevicePanel />
                    </section>
                </main>
            </div>

            {/* Device Connection Modal */}
            <DeviceConnectionModal
                isOpen={isConnectionModalOpen}
                onClose={() => { }}
                onConnect={handleConnect}
                isConnecting={isConnecting}
            />
        </>
    )
}


