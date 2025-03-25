import { useState, useEffect, useReducer } from "react";
import { mesh } from "@/lib/synthevery-core/connection/mesh";
import { getAddressString } from "@/lib/synthevery-core/connection/util";
import { P2PMacAddress } from "@/lib/synthevery-core/types/mesh";
import { playerSyncStates } from "@/lib/synthevery-core/player/states";
import { SyncState, ReadOnlySyncState } from "@/lib/synthevery-core/appstate/appstates";

export function useAppState<T>(syncState: SyncState<T>): [T, (newValue: T) => void] {
    const [state, setState] = useReducer((currentValue: T, newValue: T) => {
        syncState.getStore().value = newValue;
        syncState.notifyChange();
        return newValue;
    }, syncState.getStore().value);

    useEffect(() => {
        const callback = () => {
            setState(syncState.getStore().value);
        };

        syncState.eventEmitter.on('synced', callback);
        return () => {
            syncState.eventEmitter.off('synced', callback);
        };
    }, [syncState]);

    return [state, setState];
}

export function useReadOnlyAppState<T>(syncState: ReadOnlySyncState<T>): T {
    const [state, setState] = useState(syncState.getStore().value);

    useEffect(() => {
        const callback = () => {
            setState(syncState.getStore().value);
        };

        syncState.eventEmitter.on('synced', callback);
        return () => {
            syncState.eventEmitter.off('synced', callback);
        };
    }, [syncState]);

    return state;
}