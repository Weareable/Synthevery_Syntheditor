'use client'
import React, { createContext, useContext, ReactNode } from 'react'
import { mesh } from '@/lib/synthevery-core/connection/mesh'
import { commandDispatcher } from '@/lib/synthevery-core/command/dispatcher'
import { deviceController } from '@/lib/synthevery-core/device/controller'
import { deviceConfigManager } from '@/lib/synthevery-core/device/device-config-manager'
import { dataTransferController } from '@/lib/synthevery-core/data-transfer/data-transfer-controller'
import { trackConfigManager } from '@/lib/synthevery-core/tracks/track-config-manager'
import { playerSyncStates } from '@/lib/synthevery-core/player/states'
import { appStateSyncConnector } from '@/lib/synthevery-core/appstate/sync'
import { deviceTypeSynchronizer } from '@/lib/synthevery-core/devicetype/devicetype'
import { srarqSessionsController } from '@/lib/synthevery-core/connection/srarq/session'

interface SyntheveryContextType {
    mesh: typeof mesh
    commandDispatcher: typeof commandDispatcher
    deviceController: typeof deviceController
    deviceConfigManager: typeof deviceConfigManager
    dataTransferController: typeof dataTransferController
    trackConfigManager: typeof trackConfigManager
    playerSyncStates: typeof playerSyncStates
    appStateSyncConnector: typeof appStateSyncConnector
    deviceTypeSynchronizer: typeof deviceTypeSynchronizer
    srarqSessionsController: typeof srarqSessionsController
}

const SyntheveryContext = createContext<SyntheveryContextType | undefined>(undefined)

// 🎯 フックの外側で定義！オブジェクトが不変になる
const syntheveryValue: SyntheveryContextType = {
    mesh,
    commandDispatcher,
    deviceController,
    deviceConfigManager,
    dataTransferController,
    trackConfigManager,
    playerSyncStates,
    appStateSyncConnector,
    deviceTypeSynchronizer,
    srarqSessionsController,
}

export function SyntheveryProvider({ children }: { children: ReactNode }) {
    return (
        <SyntheveryContext.Provider value={syntheveryValue}>
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
