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
import { APPSTATE_ID_PLAYER_TICK_CLOCK, COMMAND_CLIENT_ID_APPSTATE_NOTIFY, COMMAND_CLIENT_ID_APPSTATE_RETRIEVE, COMMAND_CLIENT_ID_PLAYER_CONTROL } from '@/lib/synthevery/connection/constants';
import { AppStateID, AppStateStore, AppStateSyncInterface } from '@/types/appstate';
import { createReactStateStore, createReactSyncState, deserializeBoolean, deserializeFloat32, serializeBoolean } from '@/lib/synthevery/appstate/appstates';
import { APPSTATE_ID_PLAYER_METRONOME } from '@/lib/synthevery/connection/constants';
import { P2PMacAddress } from '@/types/mesh';
import { PlayerCommandClient } from '@/lib/synthevery/appstate/player-command-clients';

interface AppStateProviderProps {
    children: React.ReactNode;
}

interface AppStateContextValue {
    metronomeState: boolean;
    updateMetronomeState: (value: boolean, notify: boolean) => void;
    playingState: boolean;
    updatePlayingState: (value: boolean, notify: boolean) => void;
    bpmState: number;
    updateBpmState: (value: number, notify: boolean) => void;
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

    const playingStateRef = useRef<boolean>(false);
    const [playingState, setPlayingState] = useState<boolean>(false);

    const bpmStateRef = useRef<number>(120);
    const [bpmState, setBpmState] = useState<number>(120);

    const tickClockSyncState = createReactSyncState(APPSTATE_ID_PLAYER_TICK_CLOCK, {
        serialize: () => {
            return new Uint8Array();
        },
        deserialize: (data: Uint8Array) => {
            if (data.length < 9) {
                return false;
            }
            playingStateRef.current = data[0] === 1;
            const bpm = deserializeFloat32(data.slice(1, 5));
            if (bpm === null) {
                return false;
            }
            bpmStateRef.current = bpm;
            return true;
        }
    });

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

            for (const peerAddress of peerAddresses) {
                const handler = commandContext.getCommandHandler(peerAddress, false);

                const playerControlClient = new PlayerCommandClient(COMMAND_CLIENT_ID_PLAYER_CONTROL, playingStateRef, bpmStateRef);
                handler?.setClientInterface(playerControlClient);
            }

            console.log("AppStateProvider: adding metronomeSyncState to connector");
            metronomeSyncState.eventEmitter.on('synced', (sender: P2PMacAddress) => {
                console.log("AppStateProvider: synced from sender=", sender);
                const value = metronomeStateRef.current;

                console.log("AppStateProvider: setting metronomeState to", value);
                setMetronomeState(value);

            });
            connectorRef.current.addState(metronomeSyncState);

            tickClockSyncState.eventEmitter.on('synced', (sender: P2PMacAddress) => {
                setPlayingState(playingStateRef.current);
                setBpmState(bpmStateRef.current);
            });
            connectorRef.current.addState(tickClockSyncState);

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
        playingState,
        updatePlayingState: (value: boolean, notify: boolean = true) => {
            console.log("AppStateProvider: updatePlayingState()");
            playingStateRef.current = value;

            for (const peerAddress of peerAddresses) {
                const handler = commandContext.getCommandHandler(peerAddress, false);
                if (handler) {
                    handler.pushCommand({ client_id: COMMAND_CLIENT_ID_PLAYER_CONTROL, type: PlayerCommandClient.COMMAND_TYPE_PLAYING_STATE });
                }
            }
        },
        bpmState,
        updateBpmState: (value: number, notify: boolean = true) => {
            console.log("AppStateProvider: updateBpmState()");
            bpmStateRef.current = value;

            for (const peerAddress of peerAddresses) {
                const handler = commandContext.getCommandHandler(peerAddress, false);
                if (handler) {
                    handler.pushCommand({ client_id: COMMAND_CLIENT_ID_PLAYER_CONTROL, type: PlayerCommandClient.COMMAND_TYPE_BPM });
                }
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