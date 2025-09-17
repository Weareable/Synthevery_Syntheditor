'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useMesh from '@/hooks/useMesh'

export default function ConnectionPage() {
    const [isConnecting, setIsConnecting] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'bluetooth-disabled'>('idle')
    const router = useRouter()
    const { connectedDevices, connectedPeers, connectDevice } = useMesh()

    // Web Bluetooth APIのサポートチェック
    const isBluetoothSupported = () => {
        return typeof navigator !== 'undefined' && 'bluetooth' in navigator
    }

    const isBluetoothEnabled = async () => {
        if (typeof navigator === 'undefined' || !navigator.bluetooth) {
            return false
        }

        try {
            // getAvailability()メソッドが存在するかチェック
            if (typeof navigator.bluetooth.getAvailability === 'function') {
                return await navigator.bluetooth.getAvailability()
            }
            
            // getAvailability()が利用できない場合は、requestDevice()でテスト
            // ただし、実際のデバイス選択ダイアログが表示されるので注意
            return true
        } catch (error) {
            console.log('Bluetooth availability check failed:', error)
            return false
        }
    }

    // 接続状態を監視
    useEffect(() => {
        if (connectedPeers.length > 0) {
            setConnectionStatus('connected')
            // 接続成功後、少し待ってからメイン画面に遷移
            setTimeout(() => {
                router.push('/player/synthesizer')
            }, 1000)
        }
    }, [connectedPeers, router])

    const handleConnect = async () => {
        setIsConnecting(true)
        setConnectionStatus('connecting')
        
        try {
            // Web Bluetooth APIのサポートチェック
            if (!isBluetoothSupported()) {
                console.log('bluetooth-not-supported')
                throw new Error('bluetooth-not-supported')
            }

            const bluetoothEnabled = await isBluetoothEnabled()
            if (!bluetoothEnabled) {
                console.log('bluetooth-disabled')
                throw new Error('bluetooth-disabled')
            }

            // 実際の接続処理
            await connectDevice()
            
            // 接続処理は非同期で行われるため、useEffectで接続状態を監視
        } catch (error) {
            console.error('接続エラー:', error)
            
            if (error instanceof Error) {
                const errorMessage = error.message.toLowerCase()
                
                // Bluetooth関連のエラーを検出
                if (errorMessage.includes('bluetooth') || 
                    errorMessage.includes('web bluetooth api globally disabled') ||
                    errorMessage.includes('bluetooth-not-supported') ||
                    errorMessage.includes('bluetooth-disabled') ||
                    errorMessage.includes('user cancelled') ||
                    errorMessage.includes('user canceled') ||
                    errorMessage.includes('request device') ||
                    errorMessage.includes('permission') ||
                    errorMessage.includes('not allowed') ||
                    errorMessage.includes('not supported')) {
                    setConnectionStatus('bluetooth-disabled')
                } else {
                    setConnectionStatus('error')
                }
            } else {
                setConnectionStatus('error')
            }
            
            setIsConnecting(false)
        }
    }

    const getStatusMessage = () => {
        switch (connectionStatus) {
            case 'connecting':
                return 'デバイスを検索中...'
            case 'connected':
                return '接続完了！メイン画面に移動します...'
            case 'error':
                return '接続に失敗しました。もう一度お試しください。'
            case 'bluetooth-disabled':
                return 'Bluetoothが無効になっています'
            default:
                return 'デバイスを接続して、Syntheveryの世界を体験しましょう'
        }
    }

    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'connecting':
                return 'text-blue-500'
            case 'connected':
                return 'text-green-500'
            case 'error':
                return 'text-red-500'
            case 'bluetooth-disabled':
                return 'text-orange-500'
            default:
                return 'text-muted-foreground'
        }
    }

    const getBluetoothInstructions = () => {
        return (
            <div className="text-left space-y-2 text-xs text-muted-foreground">
                <p className="font-medium text-orange-600">Bluetoothを有効にする方法:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>ブラウザの設定でBluetoothを有効にしてください</li>
                    <li>Chrome: chrome://flags/#enable-web-bluetooth で有効化</li>
                    <li>Edge: edge://flags/#enable-web-bluetooth で有効化</li>
                    <li>システムのBluetooth設定も確認してください</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                    ※ HTTPS環境でのみBluetoothが利用可能です
                </p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                        <svg 
                            className="w-8 h-8 text-primary-foreground" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M13 10V3L4 14h7v7l9-11h-7z" 
                            />
                        </svg>
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-foreground">
                            Synthevery
                        </CardTitle>
                        <CardDescription className="text-muted-foreground mt-2">
                            音楽制作の新しい体験へようこそ
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center space-y-2">
                        <p className={`text-sm ${getStatusColor()}`}>
                            {getStatusMessage()}
                        </p>
                        {connectionStatus === 'idle' && (
                            <p className="text-xs text-muted-foreground">
                                接続には数秒かかる場合があります
                            </p>
                        )}
                        {connectionStatus === 'connecting' && (
                            <p className="text-xs text-muted-foreground">
                                近くのSyntheveryデバイスを検索中...
                            </p>
                        )}
                        {connectionStatus === 'connected' && (
                            <div className="text-xs text-green-500">
                                <p>接続されたデバイス: {connectedPeers.length}台</p>
                                {connectedPeers.map((device, index) => (
                                    <p key={index} className="text-xs text-muted-foreground">
                                        {device}
                                    </p>
                                ))}
                            </div>
                        )}
                        {connectionStatus === 'bluetooth-disabled' && (
                            getBluetoothInstructions()
                        )}
                    </div>
                    
                    <Button 
                        onClick={handleConnect}
                        disabled={isConnecting || connectionStatus === 'connected'}
                        className="w-full h-12 text-base font-medium"
                        size="lg"
                    >
                        {isConnecting ? (
                            <>
                                <svg 
                                    className="animate-spin -ml-1 mr-3 h-5 w-5" 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    fill="none" 
                                    viewBox="0 0 24 24"
                                >
                                    <circle 
                                        className="opacity-25" 
                                        cx="12" 
                                        cy="12" 
                                        r="10" 
                                        stroke="currentColor" 
                                        strokeWidth="4"
                                    />
                                    <path 
                                        className="opacity-75" 
                                        fill="currentColor" 
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                接続中...
                            </>
                        ) : connectionStatus === 'connected' ? (
                            '接続完了'
                        ) : connectionStatus === 'error' || connectionStatus === 'bluetooth-disabled' ? (
                            '再接続'
                        ) : (
                            'Syntheveryに接続'
                        )}
                    </Button>
                    
                    {(connectionStatus === 'error' || connectionStatus === 'bluetooth-disabled') && (
                        <div className="text-center">
                            <Button 
                                onClick={handleConnect}
                                variant="outline"
                                size="sm"
                                className="w-full"
                            >
                                もう一度試す
                            </Button>
                        </div>
                    )}
                    
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                            接続に問題がある場合は、デバイスが近くにあることを確認してください
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 