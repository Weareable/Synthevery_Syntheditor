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
import { createReactStateStore, createReactSyncState, deserializeArrayFixedLength, deserializeBoolean, deserializeFloat32, deserializeMap, deserializeStringP2PMacAddress, deserializeUint32, deserializeUint8, serializeArrayFixedLength, serializeBoolean, serializeMap, serializeStringP2PMacAddress, serializeUint32, serializeUint8 } from '@/lib/synthevery/appstate/appstates';
import {
    APPSTATE_ID_PLAYER_METRONOME,
    APPSTATE_ID_PLAYER_RECORDER,
    APPSTATE_ID_PLAYER_QUANTIZER,
    APPSTATE_ID_PLAYER_CURRENT_TRACKS,
    APPSTATE_ID_PLAYER_DEVICE_POSITIONS,
    APPSTATE_ID_PLAYER_TRACK_STATES
} from '@/lib/synthevery/connection/constants';
import { P2PMacAddress } from '@/types/mesh';
import { PlayerCommandClient } from '@/lib/synthevery/appstate/player-command-clients';
import { getAddressFromString, getAddressString } from '@/lib/synthevery/connection/mesh-node';

interface TrackState {
    loopLengthTicks: number;
    mute: boolean;
    volume: number;
};

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
    recorderState: boolean;
    updateRecorderState: (value: boolean, notify: boolean) => void;
    quantizerState: boolean;
    updateQuantizerState: (value: boolean, notify: boolean) => void;
    currentTracksState: Map<string, number>;
    updateCurrentTracksState: (value: Map<string, number>, notify: boolean) => void;
    trackStates: Array<TrackState>;
    updateTrackStates: (value: Array<TrackState>, notify: boolean) => void;
    devicePositions: Map<string, number>;
    updateDevicePositions: (value: Map<string, number>, notify: boolean) => void;
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

    const metronomeSyncState = useRef<AppStateSyncInterface>(createReactSyncState(APPSTATE_ID_PLAYER_METRONOME, createReactStateStore(
        (value) => serializeBoolean(value),
        (data) => deserializeBoolean(data),
        metronomeStateRef
    )));

    const playingStateRef = useRef<boolean>(false);
    const [playingState, setPlayingState] = useState<boolean>(false);

    const bpmStateRef = useRef<number>(120);
    const [bpmState, setBpmState] = useState<number>(120);

    const tickClockSyncState = useRef<AppStateSyncInterface>(createReactSyncState(APPSTATE_ID_PLAYER_TICK_CLOCK, {
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
    }));

    const recorderStateRef = useRef<boolean>(false);
    const [recorderState, setRecorderState] = useState<boolean>(false);

    const recorderSyncState = useRef<AppStateSyncInterface>(createReactSyncState(APPSTATE_ID_PLAYER_RECORDER, createReactStateStore(
        (value) => serializeBoolean(value),
        (data) => deserializeBoolean(data),
        recorderStateRef
    )));

    const quantizerStateRef = useRef<boolean>(false);
    const [quantizerState, setQuantizerState] = useState<boolean>(false);

    const quantizerSyncState = useRef<AppStateSyncInterface>(createReactSyncState(APPSTATE_ID_PLAYER_QUANTIZER, createReactStateStore(
        (value) => serializeBoolean(value),
        (data) => deserializeBoolean(data),
        quantizerStateRef
    )));

    const currentTracksStateRef = useRef<Map<string, number>>(new Map());
    const [currentTracksState, setCurrentTracksState] = useState<Map<string, number>>(new Map());

    const currentTracksSyncState = useRef<AppStateSyncInterface>(createReactSyncState(APPSTATE_ID_PLAYER_CURRENT_TRACKS, createReactStateStore(
        (value) => serializeMap(value, serializeStringP2PMacAddress, serializeUint8, 6, 1),
        (data) => deserializeMap(data, deserializeStringP2PMacAddress, deserializeUint8, 6, 1),
        currentTracksStateRef
    )));

    function serializeTrackState(value: TrackState): Uint8Array {
        const loopLengthBytes = serializeUint32(value.loopLengthTicks);
        const muteBytes = serializeBoolean(value.mute);
        const volumeBytes = serializeUint8(value.volume);

        const result = new Uint8Array(6);
        result.set(loopLengthBytes, 0);
        result.set(muteBytes, 4);
        result.set(volumeBytes, 5);
        return result;
    }

    function deserializeTrackState(data: Uint8Array): TrackState | null {
        if (data.length < 6) {
            return null;
        }
        const loopLengthTicks = deserializeUint32(data.slice(0, 4));
        const mute = deserializeBoolean(data.slice(4, 5));
        const volume = deserializeUint8(data.slice(5, 6));
        if (loopLengthTicks !== null && mute !== null && volume !== null) {
            return { loopLengthTicks, mute, volume };
        }
        return null;
    }

    const trackStatesRef = useRef<Array<TrackState>>(Array.from({ length: 8 }, () => { return { loopLengthTicks: 1920, mute: false, volume: 100 } }));
    const [trackStates, setTrackStates] = useState<Array<TrackState>>(trackStatesRef.current);

    const trackStatesSyncState = useRef<AppStateSyncInterface>(createReactSyncState(APPSTATE_ID_PLAYER_TRACK_STATES, createReactStateStore(
        (value) => serializeArrayFixedLength(value, serializeTrackState, 6),
        (data) => deserializeArrayFixedLength(data, deserializeTrackState, 6),
        trackStatesRef
    )));

    const devicePositionsRef = useRef<Map<string, number>>(new Map());
    const [devicePositions, setDevicePositions] = useState<Map<string, number>>(new Map());

    const devicePositionsSyncState = useRef<AppStateSyncInterface>(createReactSyncState(APPSTATE_ID_PLAYER_DEVICE_POSITIONS, createReactStateStore(
        (value) => serializeMap(value, serializeStringP2PMacAddress, serializeUint8, 6, 1),
        (data) => deserializeMap(data, deserializeStringP2PMacAddress, deserializeUint8, 6, 1),
        devicePositionsRef
    )));


    const peerAddressesRef = useRef<P2PMacAddress[]>([]);

    useEffect(() => {
        if (!meshContext.isMeshReady) {
            return;
        }

        try {
            console.log("AppStateProvider: meshContext.isMeshReady=", meshContext.isMeshReady);
            peerAddressesRef.current = [meshContext.getPeerAddress()];
            console.log("AppStateProvider: peerAddresses=", peerAddressesRef.current);

            console.log("AppStateProvider: creating connector with peerAddresses=", peerAddressesRef.current);
            connectorRef.current = new AppStateSyncConnector(
                COMMAND_CLIENT_ID_APPSTATE_NOTIFY,
                COMMAND_CLIENT_ID_APPSTATE_RETRIEVE,
                meshContext,
                commandContext,
                peerAddressesRef.current
            );

            for (const peerAddress of peerAddressesRef.current) {
                const handler = commandContext.getCommandHandler(peerAddress, false);

                const playerControlClient = new PlayerCommandClient(COMMAND_CLIENT_ID_PLAYER_CONTROL, playingStateRef, bpmStateRef);
                handler?.setClientInterface(playerControlClient);
            }

            console.log("AppStateProvider: adding metronomeSyncState to connector");
            metronomeSyncState.current.eventEmitter.removeAllListeners('synced');
            metronomeSyncState.current.eventEmitter.on('synced', (sender: P2PMacAddress) => {
                console.log("AppStateProvider: synced from sender=", sender);
                const value = metronomeStateRef.current;

                console.log("AppStateProvider: setting metronomeState to", value);
                setMetronomeState(value);

            });
            connectorRef.current.addState(metronomeSyncState.current);

            tickClockSyncState.current.eventEmitter.removeAllListeners('synced');
            tickClockSyncState.current.eventEmitter.on('synced', (sender: P2PMacAddress) => {
                setPlayingState(playingStateRef.current);
                setBpmState(bpmStateRef.current);
            });
            connectorRef.current.addState(tickClockSyncState.current);

            recorderSyncState.current.eventEmitter.removeAllListeners('synced');
            recorderSyncState.current.eventEmitter.on('synced', (sender: P2PMacAddress) => {
                setRecorderState(recorderStateRef.current);
            });
            connectorRef.current.addState(recorderSyncState.current);

            quantizerSyncState.current.eventEmitter.removeAllListeners('synced');
            quantizerSyncState.current.eventEmitter.on('synced', (sender: P2PMacAddress) => {
                setQuantizerState(quantizerStateRef.current);
            });
            connectorRef.current.addState(quantizerSyncState.current);

            currentTracksSyncState.current.eventEmitter.removeAllListeners('synced');
            currentTracksSyncState.current.eventEmitter.on('synced', (sender: P2PMacAddress) => {
                setCurrentTracksState(currentTracksStateRef.current);
            });
            connectorRef.current.addState(currentTracksSyncState.current);

            trackStatesSyncState.current.eventEmitter.removeAllListeners('synced');
            trackStatesSyncState.current.eventEmitter.on('synced', (sender: P2PMacAddress) => {
                setTrackStates(trackStatesRef.current);
            });
            connectorRef.current.addState(trackStatesSyncState.current);

            devicePositionsSyncState.current.eventEmitter.removeAllListeners('synced');
            devicePositionsSyncState.current.eventEmitter.on('synced', (sender: P2PMacAddress) => {
                setDevicePositions(devicePositionsRef.current);
            });
            connectorRef.current.addState(devicePositionsSyncState.current);

            console.log("AppStateProvider: retrieving all states");
            connectorRef.current.retrieveAllStates(meshContext.getPeerAddress());

        } catch (error) {
            console.warn("AppStateProvider: peer not connected");
        }
    }, [meshContext, commandContext]);

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

            for (const peerAddress of peerAddressesRef.current) {
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

            for (const peerAddress of peerAddressesRef.current) {
                const handler = commandContext.getCommandHandler(peerAddress, false);
                if (handler) {
                    handler.pushCommand({ client_id: COMMAND_CLIENT_ID_PLAYER_CONTROL, type: PlayerCommandClient.COMMAND_TYPE_BPM });
                }
            }
        },
        recorderState,
        updateRecorderState: (value: boolean, notify: boolean = true) => {
            console.log("AppStateProvider: updateRecorderState()");
            recorderStateRef.current = value;
            setRecorderState(value);
            if (notify) {
                connectorRef.current?.getState(APPSTATE_ID_PLAYER_RECORDER)?.notifyChange();
            }
        },
        quantizerState,
        updateQuantizerState: (value: boolean, notify: boolean = true) => {
            console.log("AppStateProvider: updateQuantizerState()");
            quantizerStateRef.current = value;
            setQuantizerState(value);
            if (notify) {
                connectorRef.current?.getState(APPSTATE_ID_PLAYER_QUANTIZER)?.notifyChange();
            }
        },
        currentTracksState,
        updateCurrentTracksState: (value: Map<string, number>, notify: boolean = true) => {
            console.log("AppStateProvider: updateCurrentTracksState()");
            currentTracksStateRef.current = value;
            setCurrentTracksState(new Map(value));
            if (notify) {
                connectorRef.current?.getState(APPSTATE_ID_PLAYER_CURRENT_TRACKS)?.notifyChange();
            }
        },
        trackStates,
        updateTrackStates: (value: Array<TrackState>, notify: boolean = true) => {
            console.log("AppStateProvider: updateTrackStates()");
            trackStatesRef.current = value;
            setTrackStates(new Array(...value));
            if (notify) {
                connectorRef.current?.getState(APPSTATE_ID_PLAYER_TRACK_STATES)?.notifyChange();
            }
        },
        devicePositions,
        updateDevicePositions: (value: Map<string, number>, notify: boolean = true) => {
            console.log("AppStateProvider: updateDevicePositions()");
            devicePositionsRef.current = value;
            setDevicePositions(new Map(value));
            if (notify) {
                connectorRef.current?.getState(APPSTATE_ID_PLAYER_DEVICE_POSITIONS)?.notifyChange();
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