'use client'

import { useState, useEffect } from 'react'
import { useSynthevery } from '@/contexts/SyntheveryContext'

export default function OldestNodeFinderTestPage() {
    const { mesh } = useSynthevery()
    const [deviceOrders, setDeviceOrders] = useState<string[]>([])
    const [oldestDevice, setOldestDevice] = useState<string | null>(null)
    const [leaderMacAddress, setLeaderMacAddress] = useState<string | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<string>('未接続')

    useEffect(() => {
        // 初期状態を取得
        updateDisplay()

        // イベントリスナーを設定
        const meshEmitter = mesh.eventEmitter

        const handleConnectedDevicesChanged = () => {
            updateDisplay()
        }

        const handlePeerConnected = () => {
            updateDisplay()
        }

        const handlePeerDisconnected = () => {
            updateDisplay()
        }

        meshEmitter.on('connectedDevicesChanged', handleConnectedDevicesChanged)
        meshEmitter.on('peerConnected', handlePeerConnected)
        meshEmitter.on('peerDisconnected', handlePeerDisconnected)

        // 接続状態を更新
        updateConnectionStatus()

        return () => {
            meshEmitter.off('connectedDevicesChanged', handleConnectedDevicesChanged)
            meshEmitter.off('peerConnected', handlePeerConnected)
            meshEmitter.off('peerDisconnected', handlePeerDisconnected)
        }
    }, [mesh])

    const updateConnectionStatus = () => {
        const connectedPeers = mesh.getConnectedPeers()
        if (connectedPeers.length > 0) {
            setConnectionStatus(`接続中 (${connectedPeers.length}デバイス)`)
        } else {
            setConnectionStatus('未接続')
        }
    }

    const updateDisplay = () => {
        // 接続状態を更新
        updateConnectionStatus()

        // デバイス順序を取得
        const deviceOrder = mesh.getDeviceOrder()
        setDeviceOrders(deviceOrder.map(device =>
            Array.from(device.address).map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase()
        ))

        // 最古デバイスを取得（最初のデバイス）
        if (deviceOrder.length > 0) {
            const oldest = deviceOrder[0]
            setOldestDevice(Array.from(oldest.address).map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase())
        } else {
            setOldestDevice(null)
        }

        // リーダーMACアドレスを取得
        const leader = mesh.getLeaderMacAddress()
        setLeaderMacAddress(leader ? Array.from(leader.address).map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase() : null)
    }

    const connectToDevice = async () => {
        if (isConnecting) return

        setIsConnecting(true)
        setConnectionStatus('接続中...')

        try {
            await mesh.connectDevice()
            setConnectionStatus('接続完了')
        } catch (error) {
            console.error('接続エラー:', error)
            setConnectionStatus('接続失敗')
        } finally {
            setIsConnecting(false)
        }
    }

    const disconnectAll = async () => {
        const connectedPeers = mesh.getConnectedPeers()
        for (const peer of connectedPeers) {
            try {
                await mesh.disconnectDevice(peer)
            } catch (error) {
                console.error('切断エラー:', error)
            }
        }
        updateDisplay()
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Mesh テスト</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* テスト操作パネル */}
                <div className="bg-gray-100 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">テスト操作</h2>

                    <div className="space-y-4">

                        <div className="flex space-x-2">
                            <button
                                onClick={connectToDevice}
                                disabled={isConnecting}
                                className={`px-4 py-2 rounded text-white ${isConnecting
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-500 hover:bg-blue-600'
                                    }`}
                            >
                                {isConnecting ? '接続中...' : 'BLEデバイス接続'}
                            </button>
                            <button
                                onClick={disconnectAll}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                                全切断
                            </button>
                        </div>

                        <div className="flex space-x-2">
                            <button
                                onClick={updateDisplay}
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                            >
                                更新
                            </button>
                        </div>
                    </div>
                </div>

                {/* 状態表示パネル */}
                <div className="bg-gray-100 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">現在の状態</h2>

                    <div className="space-y-4">
                        <div>
                            <span className="font-medium">最古デバイス: </span>
                            <span className="text-blue-600">{oldestDevice || 'なし'}</span>
                        </div>

                        <div>
                            <span className="font-medium">接続状態: </span>
                            <span className={`${connectionStatus.includes('接続中') ? 'text-green-600' : 'text-red-600'}`}>
                                {connectionStatus}
                            </span>
                        </div>

                        <div>
                            <span className="font-medium">接続デバイス数: </span>
                            <span className="text-green-600">{deviceOrders.length}</span>
                        </div>

                        <div>
                            <span className="font-medium">リーダーMACアドレス: </span>
                            <span className="text-purple-600 font-mono">{leaderMacAddress || 'なし'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* デバイス順序リスト */}
            <div className="mt-6 bg-gray-100 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">デバイス接続順序 (Mesh)</h2>

                {deviceOrders.length === 0 ? (
                    <p className="text-gray-500">接続中のデバイスがありません</p>
                ) : (
                    <div className="space-y-2">
                        {deviceOrders.map((deviceId, index) => (
                            <div key={deviceId} className="flex items-center space-x-4 p-2 bg-white rounded">
                                <span className="font-bold text-lg w-8">{String.fromCharCode(65 + index)}</span>
                                <span className="font-mono">{deviceId}</span>
                                <span className="text-sm text-gray-500">
                                    順序: {index}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* デバッグ情報 */}
            <div className="mt-6 bg-gray-100 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">デバッグ情報</h2>

                <div className="space-y-2 text-sm">
                    <div>
                        <span className="font-medium">Mesh初期化: </span>
                        <span className="text-green-600">完了</span>
                    </div>
                    <div>
                        <span className="font-medium">BLE特性受信: </span>
                        <span className="text-green-600">準備完了</span>
                    </div>
                    <div>
                        <span className="font-medium">デバイス順序管理: </span>
                        <span className="text-green-600">Mesh統合完了</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
