import { mesh } from '../connection/mesh';
import { commandDispatcher } from '../command/dispatcher';
import { EventEmitter } from 'eventemitter3';
import { P2PMacAddress } from '../types/mesh';
import { AppStateID, AppStateSyncInterface } from '../types/appstate';
import { CommandID } from '../types/command';
import { AppStateNotifyCommandClient, AppStateRetrieveCommandClient } from './command-clients';
import { COMMAND_CLIENT_ID_APPSTATE_NOTIFY, COMMAND_CLIENT_ID_APPSTATE_RETRIEVE } from '../command/constants';


interface AppStateSyncConnectorEvents {
    synced: (appStateId: AppStateID, source: P2PMacAddress) => void;
}
class AppStateSyncConnector {
    private syncStates: Map<AppStateID, AppStateSyncInterface> = new Map();
    public readonly eventEmitter = new EventEmitter<AppStateSyncConnectorEvents>();

    constructor() {
        mesh.eventEmitter.on('connectedDevicesChanged', (connectedDevices: P2PMacAddress[]) => {
            for (const device of connectedDevices) {
                this.initializeNode(device);
            }
            if (mesh.getConnectedPeers().length > 0) {
                this.retrieveAllStates(mesh.getConnectedPeers()[0]);
            }
        });
    }

    addState(state: AppStateSyncInterface): boolean {
        const result = !this.syncStates.has(state.getID());
        if (result) {
            this.syncStates.set(state.getID(), state);
            state.eventEmitter.on('notify', () => {
                this.notifyStateUpdate(state.getID());
            });
        }
        return result;
    }

    getState(appStateId: AppStateID): AppStateSyncInterface | undefined {
        return this.syncStates.get(appStateId);
    }

    notifyStateUpdate(appStateId: AppStateID, source: P2PMacAddress = { address: new Uint8Array() }): void {
        const state = this.getState(appStateId);
        if (state === undefined) {
            return;
        }

        if (mesh.getConnectedPeers().length === 0) {
            console.warn("notifyStateUpdate() : no connected peers");
            return;
        }

        const first_peer_address = mesh.getConnectedPeers()[0];
        const command: CommandID = {
            client_id: COMMAND_CLIENT_ID_APPSTATE_NOTIFY,
            type: appStateId,
        };
        const handler = commandDispatcher.getCommandHandler(first_peer_address, false);
        handler?.pushCommand(command);
    }

    retrieveAllStates(destination: P2PMacAddress): void {
        const available = commandDispatcher.isAvailable(destination);
        if (!available) {
            console.warn("retrieveAllStates() : destination is not available");
            return;
        }

        for (const state of this.syncStates.values()) {
            const command: CommandID = {
                client_id: COMMAND_CLIENT_ID_APPSTATE_RETRIEVE,
                type: state.getID(),
            };
            const handler = commandDispatcher.getCommandHandler(destination, false);
            handler?.pushCommand(command);
        }
    }

    private isAvailable(peer: P2PMacAddress): boolean {
        return commandDispatcher.isAvailable(peer);
    }

    private initializeNode(address: P2PMacAddress): void {
        const handler = commandDispatcher.getCommandHandler(address, true);
        if (handler === undefined) {
            console.error("initializeNode() : handler could not be created");
            return;
        }

        // Notify Command Client
        if (!handler.hasClientInterface(COMMAND_CLIENT_ID_APPSTATE_NOTIFY)) {
            const notifyClient = new AppStateNotifyCommandClient(
                COMMAND_CLIENT_ID_APPSTATE_NOTIFY,
                address,
                (sender: P2PMacAddress, type: number) =>
                    this.serializeNotifyState(sender, type),
                (sender: P2PMacAddress, type: number, data: Uint8Array) =>
                    this.deserializeNotifiedState(sender, type, data),
                (sender: P2PMacAddress, type: number, success: boolean) =>
                    this.onNotifyResult(sender, type, success),
                () => false
            );
            handler?.setClientInterface(notifyClient);
        }

        // Retrieve Command Client
        if (!handler.hasClientInterface(COMMAND_CLIENT_ID_APPSTATE_RETRIEVE)) {
            const retrieveClient = new AppStateRetrieveCommandClient(
                COMMAND_CLIENT_ID_APPSTATE_RETRIEVE,
                address,
                (sender: P2PMacAddress, type: number) =>
                    this.retrieveState(sender, type),
                (sender: P2PMacAddress, type: number, data: Uint8Array) =>
                    this.deserializeRetrievedState(sender, type, data),
                (sender: P2PMacAddress, type: number, success: boolean) =>
                    this.onRetrieveResult(sender, type, success)
            );
            handler?.setClientInterface(retrieveClient);
        }
    }

    private serializeNotifyState(
        sender: P2PMacAddress,
        type: number
    ): Uint8Array {
        const state = this.syncStates.get(type);
        if (!state) {
            return new Uint8Array();
        }
        return state.getStore().serialize();
    }

    private deserializeNotifiedState(
        sender: P2PMacAddress,
        type: number,
        data: Uint8Array
    ): number {
        const state = this.syncStates.get(type);
        if (!state) {
            return AppStateNotifyCommandClient.ReceptionResult.kUnknownType;
        }
        if (!state.getStore().deserialize(data)) {
            return AppStateNotifyCommandClient.ReceptionResult
                .kDeserializationError;
        }

        // Receiverに対して, onSynced()をemitする
        state.eventEmitter.emit('synced', { source: sender });

        this.notifyStateUpdate(type, sender);

        return AppStateNotifyCommandClient.ReceptionResult.kSuccess;
    }

    public retrieveState(
        sender: P2PMacAddress,
        type: number
    ): [boolean, Uint8Array] {
        const state = this.syncStates.get(type);
        if (!state) {
            return [false, new Uint8Array()];
        }
        return [true, state.getStore().serialize()];
    }

    private deserializeRetrievedState(
        sender: P2PMacAddress,
        type: number,
        data: Uint8Array
    ): number {
        const state = this.syncStates.get(type);
        if (!state) {
            return AppStateRetrieveCommandClient.ReceptionResult.kUnknownType;
        }

        if (!state.getStore().deserialize(data)) {
            return AppStateRetrieveCommandClient.ReceptionResult.kDeserializationError;
        }

        return AppStateRetrieveCommandClient.ReceptionResult.kSuccess;
    }

    private onNotifyResult(
        sender: P2PMacAddress,
        type: number,
        success: boolean
    ): void {
        if (success) {
            // 特に処理は必要ない
        } else {
            console.warn('onNotifyResult(): failed');
            if (this.isAvailable(sender)) {
                const command: CommandID = {
                    client_id: COMMAND_CLIENT_ID_APPSTATE_NOTIFY,
                    type,
                };
                const handler = commandDispatcher.getCommandHandler(sender, false);
                handler?.pushCommand(command);
            }
        }
    }

    private onRetrieveResult(
        sender: P2PMacAddress,
        type: number,
        success: boolean
    ): void {
        if (success) {
            const state = this.syncStates.get(type);
            if (!state) {
                return;
            }
            state.eventEmitter.emit('synced', { source: sender });
        } else {
            console.warn('onRetrieveResult(): failed');
            if (this.isAvailable(sender)) {
                const command: CommandID = {
                    client_id: COMMAND_CLIENT_ID_APPSTATE_RETRIEVE,
                    type,
                };
                const handler = commandDispatcher.getCommandHandler(sender, false);
                handler?.pushCommand(command);
            }
        }
    }
}

export const appStateSyncConnector = new AppStateSyncConnector();
