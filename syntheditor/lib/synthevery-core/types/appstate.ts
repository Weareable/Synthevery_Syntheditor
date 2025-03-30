import EventEmitter from 'eventemitter3';
import { P2PMacAddress } from './mesh';

export type AppStateID = number;

export interface AppStateStoreInterface {
    serialize(): Uint8Array;
    deserialize(data: Uint8Array): boolean;
}

export interface AppStateSyncEvents {
    synced: { sender: P2PMacAddress };
    notify: void;
}

export interface AppStateSyncInterface {
    getID(): AppStateID;
    getStore(): AppStateStoreInterface;
    eventEmitter: EventEmitter<AppStateSyncEvents>;
    notifyChange(): void;
}