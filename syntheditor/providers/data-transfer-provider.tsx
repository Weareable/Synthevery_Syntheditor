"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useMemo,
    PropsWithChildren,
    useRef,
    useReducer,
} from 'react';

import { useCommandContext } from './command-provider';
import { useMeshContext } from './mesh-provider';
import { COMMAND_CLIENT_ID_DATA_TRANSFER } from '@/lib/synthevery/connection/constants';
import { P2PMacAddress } from '@/types/mesh';
import { DataTransferController } from '@/lib/synthevery/data-transfer/data-transfer-controller';

interface DataTransferProviderProps {
    children: React.ReactNode;
}

interface DataTransferContextValue {

}

const DataTransferContext = createContext<DataTransferContextValue | null>(null);

export function DataTransferProvider({
    children,
}: PropsWithChildren<DataTransferProviderProps>) {
    const meshContext = useMeshContext();
    const commandContext = useCommandContext();

    const controllerRef = useRef<DataTransferController | null>(null);

    const prevConnectedDevicesRef = useRef<P2PMacAddress[]>([]);

    useEffect(() => {
        if (!meshContext.isMeshReady) {
            return;
        }

        controllerRef.current = new DataTransferController(
            COMMAND_CLIENT_ID_DATA_TRANSFER,
            commandContext
        );

        for (const connectedDevice of meshContext.connectedDevices) {
            controllerRef.current?.initializeNode(connectedDevice);
        }

        /*
        // 新しく追加されたデバイスに対して初期化処理を行う
        for (const connectedDevice of meshContext.connectedDevices) {
            if (!prevConnectedDevicesRef.current.includes(connectedDevice)) {
                controllerRef.current?.initializeNode(connectedDevice);
            }
        }
        prevConnectedDevicesRef.current = meshContext.connectedDevices;
        */

    }, [meshContext, commandContext]);


}




