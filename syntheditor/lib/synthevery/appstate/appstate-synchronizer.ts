import { CommandID } from '@/types/command';
import { CommandContextValue } from '@/providers/command-provider';
import { P2PMacAddress } from '@/types/mesh';
import { AppStateID, AppStateSyncInterface } from '@/types/appstate';
import { AppStateNotifyCommandClient } from './appstate-command-clients';
import { AppStateRetrieveCommandClient } from './appstate-command-clients';
import EventEmitter from 'eventemitter3';
import { MeshContextValue } from '@/providers/mesh-provider';
import { equalsAddress } from '@/lib/synthevery/connection/mesh-node';

interface AppStateSyncConnectorEvents {
    synced: (appStateId: AppStateID, source: P2PMacAddress) => void;
}

export class AppStateSyncConnector {
    private syncStates: Map<AppStateID, AppStateSyncInterface> = new Map();
    private meshContext: MeshContextValue;
    private commandContext: CommandContextValue;
    private peers: P2PMacAddress[];
    private myAddress: P2PMacAddress;
    private notifyClientId: number;
    private retrieveClientId: number;
    public readonly eventEmitter = new EventEmitter<AppStateSyncConnectorEvents>();

    constructor(
        notifyClientId: number,
        retrieveClientId: number,
        meshContext: MeshContextValue,
        commandContext: CommandContextValue,
        peers: P2PMacAddress[]
    ) {
        this.meshContext = meshContext;
        this.commandContext = commandContext;
        this.peers = peers;
        this.myAddress = meshContext.getAddress()

        // peers から自分自身のアドレスを削除
        this.peers = this.peers.filter(
            (peer) =>
                !(
                    peer.address.length === this.myAddress.address.length &&
                    peer.address.every(
                        (value, index) => value === this.myAddress.address[index]
                    )
                )
        );

        this.notifyClientId = notifyClientId;
        this.retrieveClientId = retrieveClientId;

        this.initialize();
    }

    private initialize() {
        // 自分のアドレスとピアのアドレスに対して初期化処理を行う
        [this.myAddress, ...this.peers].forEach((address) => {
            this.initializeNode(address);
        });
    }

    public addState(state: AppStateSyncInterface): boolean {
        const result = !this.syncStates.has(state.getID());
        if (result) {
            this.syncStates.set(state.getID(), state);
            state.eventEmitter.on('notify', () => {
                this.notifyStateUpdate(state.getID());
            });
        }
        return result;
    }

    public getState(appStateId: AppStateID): AppStateSyncInterface | undefined {
        return this.syncStates.get(appStateId);
    }

    public notifyStateUpdate(
        appStateId: AppStateID,
        source: P2PMacAddress = { address: new Uint8Array() }
    ): void {
        for (const peer of this.peers) {
            if (
                equalsAddress(peer, source) ||
                equalsAddress(peer, this.myAddress) ||
                !this.isAvailable(peer)
            ) {
                continue;
            }
            const command: CommandID = {
                client_id: this.notifyClientId,
                type: appStateId,
            };
            const handler = this.commandContext.getCommandHandler(peer, false);
            handler?.pushCommand(command);
        }
    }

    public retrieveAllStates(destination: P2PMacAddress): void {
        console.log("retrieveAllStates(): destination=", destination);
        if (!this.isAvailable(destination) || equalsAddress(destination, this.myAddress)) {
            console.log("retrieveAllStates(): destination is not available");
            return;
        }

        for (const state of this.syncStates.values()) {
            const command: CommandID = {
                client_id: this.retrieveClientId,
                type: state.getID(),
            };
            console.log("retrieveAllStates(): command=", command);
            const handler = this.commandContext.getCommandHandler(destination, false);
            handler?.pushCommand(command);
        }
    }

    private isAvailable(peer: P2PMacAddress): boolean {
        return this.commandContext.isAvailable(peer);
    }

    private initializeNode(address: P2PMacAddress): void {
        console.log("initializeNode(): address=", address);
        const handler = this.commandContext.getCommandHandler(address, true);

        if (!handler) {
            console.warn("initializeNode(): handler could not be created");
            return;
        }

        // Notify Command Client
        const notifyClient = new AppStateNotifyCommandClient(
            this.notifyClientId,
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

        // Retrieve Command Client
        const retrieveClient = new AppStateRetrieveCommandClient(
            this.retrieveClientId,
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
                    client_id: this.notifyClientId,
                    type,
                };
                const handler = this.commandContext.getCommandHandler(sender, false);
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
                    client_id: this.retrieveClientId,
                    type,
                };
                const handler = this.commandContext.getCommandHandler(sender, false);
                handler?.pushCommand(command);
            }
        }
    }
}