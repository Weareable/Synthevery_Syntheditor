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
import { AppStateSyncConnector } from '@/lib/synthevery/appstate/appstate-synchronizer';
import { useCommandContext } from '@/providers/command-provider';
import { useMeshContext } from '@/providers/mesh-provider';
import { COMMAND_CLIENT_ID_APPSTATE_NOTIFY, COMMAND_CLIENT_ID_APPSTATE_RETRIEVE } from '@/lib/synthevery/connection/constants';
import { AppStateID, AppStateStore, AppStateSyncInterface } from '@/types/appstate';
import { createReactStateStore, createReactSyncState, deserializeBoolean, serializeBoolean } from '@/lib/synthevery/appstate/appstates';
import { APPSTATE_ID_PLAYER_METRONOME } from '@/lib/synthevery/connection/constants';
import { P2PMacAddress } from '@/types/mesh';

interface AppStateProviderProps {
    children: React.ReactNode;
}

interface AppStateContextValue {
    metronomeState: boolean;
    updateMetronomeState: (value: boolean, notify: boolean) => void;
    retrieveAllStates: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({
    children,
}: PropsWithChildren<AppStateProviderProps>) {
    const meshContext = useMeshContext();
    const commandContext = useCommandContext();

    const connectorRef = useRef<AppStateSyncConnector | null>(null);

    const metronomeStateRef = useRef<boolean>(false);
    const [metronomeState, setMetronomeState] = useState<boolean>(false);

    const metronomeSyncState = createReactSyncState(APPSTATE_ID_PLAYER_METRONOME, createReactStateStore(
        (value) => serializeBoolean(value),
        (data) => deserializeBoolean(data),
        metronomeStateRef
    ));

    let peerAddresses: P2PMacAddress[] = [];

    useEffect(() => {
        if (!meshContext.isMeshReady) {
            return;
        }

        try {
            console.log("AppStateProvider: meshContext.isMeshReady=", meshContext.isMeshReady);
            peerAddresses = [meshContext.getPeerAddress()];
            console.log("AppStateProvider: peerAddresses=", peerAddresses);

            console.log("AppStateProvider: creating connector with peerAddresses=", peerAddresses);
            connectorRef.current = new AppStateSyncConnector(
                COMMAND_CLIENT_ID_APPSTATE_NOTIFY,
                COMMAND_CLIENT_ID_APPSTATE_RETRIEVE,
                meshContext,
                commandContext,
                peerAddresses
            );

            console.log("AppStateProvider: adding metronomeSyncState to connector");
            metronomeSyncState.eventEmitter.on('synced', (sender: P2PMacAddress) => {
                console.log("AppStateProvider: synced from sender=", sender);
                const value = metronomeStateRef.current;

                console.log("AppStateProvider: setting metronomeState to", value);
                setMetronomeState(value);

            });
            connectorRef.current.addState(metronomeSyncState);

            console.log("AppStateProvider: retrieving all states");
            connectorRef.current.retrieveAllStates(meshContext.getPeerAddress());

        } catch (error) {
            console.warn("AppStateProvider: peer not connected");
        }
    }, [meshContext.isMeshReady]);

    const value: AppStateContextValue = {
        metronomeState,
        updateMetronomeState: (value: boolean, notify: boolean = true) => {
            console.log("AppStateProvider: updateMetronomeState()");
            metronomeStateRef.current = value;
            setMetronomeState(value);
            if (notify) {
                connectorRef.current?.getState(APPSTATE_ID_PLAYER_METRONOME)?.notifyChange();
            }
        },
        retrieveAllStates: () => {
            console.log("AppStateProvider: retrieveAllStates()");
            if (!connectorRef.current) {
                console.warn("AppStateProvider: connector not found");
                return;
            }
            connectorRef.current.retrieveAllStates(meshContext.getPeerAddress());
        },
    };

    return (
        <AppStateContext.Provider value={value}>
            {children}
        </AppStateContext.Provider>
    );
}

export function useAppStateContext() {
    const context = useContext(AppStateContext);
    if (!context) {
        throw new Error(
            'useAppStateContext must be used within an AppStateProvider'
        );
    }
    return context;
}