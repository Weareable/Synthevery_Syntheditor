import { useState, useEffect, useCallback } from "react";
import { useSynthevery } from "@/contexts/SyntheveryContext";
import { getAddressString } from "@/lib/synthevery-core/connection/util";
import { P2PMacAddress } from "@/lib/synthevery-core/types/mesh";
import { SyncState, ReadOnlySyncState } from "@/lib/synthevery-core/appstate/appstates";

export function useAppState<T>(syncState: SyncState<T>): [T, (newValue: T) => void] {
    /*
    const [state, setState] = useReducer((currentValue: T, newValue: T) => {
        syncState.getStore().value = newValue;
        syncState.notifyChange();
        return newValue;
    }, syncState.getStore().value); 
    */

    const [state, setState_] = useState(syncState.getStore().value);

    const setState = useCallback((newValue: T) => {
        syncState.getStore().value = newValue;
        syncState.notifyChange();
    }, [syncState, setState_]);

    useEffect(() => {
        const callback = () => {
            setState_(syncState.getStore().value);
        };

        syncState.eventEmitter.on('synced', callback);
        syncState.eventEmitter.on('notify', callback);
        return () => {
            syncState.eventEmitter.off('synced', callback);
            syncState.eventEmitter.off('notify', callback);
        };
    }, [syncState, setState]);

    return [state, setState];
}

export function useReadOnlyAppState<T>(syncState: ReadOnlySyncState<T>): T {
    const [state, setState] = useState(syncState.getStore().value);

    useEffect(() => {
        const callback = () => {
            setState(() => {
                return syncState.getStore().value;
            });
        };

        syncState.eventEmitter.on('synced', callback);
        return () => {
            syncState.eventEmitter.off('synced', callback);
        };
    }, [syncState]);

    return state;
}