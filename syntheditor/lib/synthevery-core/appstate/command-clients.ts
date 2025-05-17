import { CommandID, CommandResult } from '@/types/command';
import { CommandClientInterface } from '@/lib/synthevery-core/command/handler';
import { P2PMacAddress } from '@/types/mesh';

export class AppStateNotifyCommandClient implements CommandClientInterface {
    static ReceptionResult = {
        kSuccess: 0,
        kDeserializationError: 1, // No ack, resend
        kUnknownType: 2, // Ack, stop resending
        kTimeout: 3,
    };

    private peerAddress: P2PMacAddress;
    private conflictRejector: () => boolean;
    private clientId: number;
    private waitingForAck: boolean;
    private sentCommandType: number;
    private lastResult: number;
    private stateSerializer: (
        peerAddress: P2PMacAddress,
        commandType: number
    ) => Uint8Array;
    private stateReceiver: (
        peerAddress: P2PMacAddress,
        commandType: number,
        data: Uint8Array
    ) => number;
    private onResult: (
        peerAddress: P2PMacAddress,
        commandType: number,
        success: boolean
    ) => void;

    constructor(
        clientId: number,
        peerAddress: P2PMacAddress,
        stateSerializer: (
            peerAddress: P2PMacAddress,
            commandType: number
        ) => Uint8Array,
        stateReceiver: (
            peerAddress: P2PMacAddress,
            commandType: number,
            data: Uint8Array
        ) => number,
        onResult: (
            peerAddress: P2PMacAddress,
            commandType: number,
            success: boolean
        ) => void,
        conflictRejector: () => boolean
    ) {
        this.clientId = clientId;
        this.peerAddress = peerAddress;
        this.stateSerializer = stateSerializer;
        this.stateReceiver = stateReceiver;
        this.onResult = onResult;
        this.waitingForAck = false;
        this.sentCommandType = 0;
        this.lastResult = 0;
        this.conflictRejector = conflictRejector;
    }

    generateData(command: CommandID): Uint8Array {
        this.waitingForAck = true;
        this.sentCommandType = command.type;
        return this.stateSerializer(this.peerAddress, command.type);
    }

    handleData(command: CommandID, data: Uint8Array): [boolean, Uint8Array] {
        if (this.conflictRejector()) {
            if (
                command.type === this.sentCommandType &&
                this.waitingForAck
            ) {
                // Return state proposal
                return [
                    true,
                    this.stateSerializer(this.peerAddress, command.type),
                ];
            }
        }

        const result = this.stateReceiver(
            this.peerAddress,
            command.type,
            data
        );
        switch (result) {
            case AppStateNotifyCommandClient.ReceptionResult.kSuccess:
                return [true, new Uint8Array()];
            case AppStateNotifyCommandClient.ReceptionResult
                .kDeserializationError:
                return [false, new Uint8Array()];
            case AppStateNotifyCommandClient.ReceptionResult.kUnknownType:
            default:
                return [true, new Uint8Array()];
        }
    }

    handleAck(command: CommandID, data: Uint8Array): boolean {
        if (data.length === 0) {
            return true;
        }

        this.lastResult = this.stateReceiver(
            this.peerAddress,
            command.type,
            data
        );
        return (
            this.lastResult ===
            AppStateNotifyCommandClient.ReceptionResult.kSuccess
        );
    }

    onComplete(commandId: CommandID): void {
        this.waitingForAck = false;
        this.onResult(this.peerAddress, commandId.type, true);
    }

    onTimeout(commandId: CommandID): void {
        this.waitingForAck = false;
        this.onResult(this.peerAddress, commandId.type, false);
    }

    getClientID(): number {
        return this.clientId;
    }
}

export class AppStateRetrieveCommandClient implements CommandClientInterface {
    static ReceptionResult = {
        kSuccess: 0,
        kDeserializationError: 1, // No ack, resend
        kUnknownType: 2, // Ack, stop resending
    };

    private clientId: number;
    private peerAddress: P2PMacAddress;
    private stateRetriever: (
        peerAddress: P2PMacAddress,
        commandType: number
    ) => [boolean, Uint8Array];
    private stateReceiver: (
        peerAddress: P2PMacAddress,
        commandType: number,
        data: Uint8Array
    ) => number;
    private onResult: (
        peerAddress: P2PMacAddress,
        commandType: number,
        success: boolean
    ) => void;

    constructor(
        clientId: number,
        peerAddress: P2PMacAddress,
        stateRetriever: (
            peerAddress: P2PMacAddress,
            commandType: number
        ) => [boolean, Uint8Array],
        stateReceiver: (
            peerAddress: P2PMacAddress,
            commandType: number,
            data: Uint8Array
        ) => number,
        onResult: (
            peerAddress: P2PMacAddress,
            commandType: number,
            success: boolean
        ) => void
    ) {
        this.clientId = clientId;
        this.peerAddress = peerAddress;
        this.stateRetriever = stateRetriever;
        this.stateReceiver = stateReceiver;
        this.onResult = onResult;
    }

    generateData(command: CommandID): Uint8Array {
        return new Uint8Array();
    }

    handleData(command: CommandID, data: Uint8Array): [boolean, Uint8Array] {
        return this.stateRetriever(this.peerAddress, command.type);
    }

    handleAck(command: CommandID, data: Uint8Array): boolean {
        const result = this.stateReceiver(
            this.peerAddress,
            command.type,
            data
        );
        switch (result) {
            case AppStateRetrieveCommandClient.ReceptionResult.kSuccess:
            case AppStateRetrieveCommandClient.ReceptionResult.kUnknownType:
                return true;
            case AppStateRetrieveCommandClient.ReceptionResult
                .kDeserializationError:
            default:
                return false;
        }
    }

    onComplete(commandId: CommandID): void {
        this.onResult(this.peerAddress, commandId.type, true);
    }

    onTimeout(commandId: CommandID): void {
        this.onResult(this.peerAddress, commandId.type, false);
    }

    getClientID(): number {
        return this.clientId;
    }
}