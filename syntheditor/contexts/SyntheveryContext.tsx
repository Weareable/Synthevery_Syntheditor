'use client'
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { syntheveryServiceContainer, SyntheveryServices } from '@/lib/synthevery-core/service-container'

interface SyntheveryContextType {
    mesh: SyntheveryServices['mesh']
    commandDispatcher: SyntheveryServices['commandDispatcher']
    deviceController: SyntheveryServices['deviceController']
    deviceConfigManager: SyntheveryServices['deviceConfigManager']
    dataTransferController: SyntheveryServices['dataTransferController']
    trackConfigManager: SyntheveryServices['trackConfigManager']
    instrumentRepository: SyntheveryServices['instrumentRepository']
    instrumentService: SyntheveryServices['instrumentService']
    playerSyncStates: SyntheveryServices['playerSyncStates']
    appStateSyncConnector: SyntheveryServices['appStateSyncConnector']
    deviceTypeSynchronizer: SyntheveryServices['deviceTypeSynchronizer']
    srarqSessionsController: SyntheveryServices['srarqSessionsController']
    timeSyncService: SyntheveryServices['timeSyncService']
    crdtProjectionStore: SyntheveryServices['crdtProjectionStore']
}

const SyntheveryContext = createContext<SyntheveryContextType | undefined>(undefined)

export function SyntheveryProvider({ children }: { children: ReactNode }) {
    const [services, setServices] = useState<SyntheveryServices | null>(null)

    useEffect(() => {
        // クライアントサイドでのみ実行される
        console.log('Initializing Synthevery services on the client...')

        try {
            const initializedServices = syntheveryServiceContainer.initialize()
            setServices(initializedServices)
        } catch (error) {
            console.error('Failed to initialize Synthevery services:', error)
        }
    }, [])

    // サービスが初期化されるまではローディングUIなどを表示
    if (!services) {
        return <div>Loading Synthevery Services...</div>
    }

    // 初期化完了後、Context経由で全サービスを配下のコンポーネントに提供
    return (
        <SyntheveryContext.Provider value={services}>
            {children}
        </SyntheveryContext.Provider>
    )
}

export function useSynthevery() {
    const context = useContext(SyntheveryContext)
    if (context === undefined) {
        throw new Error('useSynthevery must be used within a SyntheveryProvider')
    }
    return context
}