import { dataTransferController } from "../data-transfer/data-transfer-controller";
import { ReceiverPortInterface, ReceiverSessionInterface, ReceiverDataStoreInterface } from "../data-transfer/interfaces";
import { DataType, RequestData, ResponseData } from "../types/data-transfer";
import { DataTypes, SessionID } from "../data-transfer/constants";
import { P2PMacAddress } from "../types/mesh";
import { JsonReceiverDataStore, JsonSenderDataStore } from "../data-transfer/json-store";
import { EventEmitter } from "eventemitter3";
import { NoteBuilderConfig, GeneratorConfig } from "../types/player";

interface NoteBuilderConfigReceiverPortEvents {
    received: (json: any, sender: P2PMacAddress) => void;
}

interface GeneratorConfigReceiverPortEvents {
    received: (json: any, sender: P2PMacAddress) => void;
}

export class NoteBuilderConfigReceiverPort implements ReceiverPortInterface {
    readonly eventEmitter = new EventEmitter<NoteBuilderConfigReceiverPortEvents>();

    getDataType(): DataType {
        return DataTypes.kNoteBuilderConfig;
    }

    handleRequest(sender: P2PMacAddress, sessionId: SessionID, data: RequestData): { receiver: ReceiverDataStoreInterface, responseData: ResponseData } {
        const receiver = new JsonReceiverDataStore(data.totalSize, sender);
        receiver.eventEmitter.on('received', (json: any, sender: P2PMacAddress) => {
            this.eventEmitter.emit('received', json, sender);
        });
        const responseData: ResponseData = {
            isAccepted: true,
            reason: 0
        };
        return { receiver, responseData };
    }

    onStart(session: ReceiverSessionInterface, id: SessionID): void {
        console.warn("NoteBuilderConfigReceiverPort: onStart session: ", session, "id: ", id);
    }

    onFinish(session: ReceiverSessionInterface, id: SessionID): void {
        console.warn("NoteBuilderConfigReceiverPort: onFinish session: ", session, "id: ", id);
    }

}

export class GeneratorConfigReceiverPort implements ReceiverPortInterface {
    readonly eventEmitter = new EventEmitter<GeneratorConfigReceiverPortEvents>();

    getDataType(): DataType {
        return DataTypes.kGeneratorConfig;
    }

    handleRequest(sender: P2PMacAddress, sessionId: SessionID, data: RequestData): { receiver: ReceiverDataStoreInterface, responseData: ResponseData } {
        const receiver = new JsonReceiverDataStore(data.totalSize, sender);
        receiver.eventEmitter.on('received', (json: any, sender: P2PMacAddress) => {
            this.eventEmitter.emit('received', json, sender);
        });
        const responseData: ResponseData = {
            isAccepted: true,
            reason: 0
        };
        return { receiver, responseData };
    }

    onStart(session: ReceiverSessionInterface, id: SessionID): void {
        console.warn("GeneratorConfigReceiverPort: onStart session: ", session, "id: ", id);
    }

    onFinish(session: ReceiverSessionInterface, id: SessionID): void {
        console.warn("GeneratorConfigReceiverPort: onFinish session: ", session, "id: ", id);
    }

}

export function sendNoteBuilderConfig(receiver: P2PMacAddress, config: NoteBuilderConfig[]): boolean {
    const store = new JsonSenderDataStore(config, DataTypes.kNoteBuilderConfig, "");
    const result = dataTransferController.sendRequest(receiver, store, []);
    if (result === null) {
        return false;
    }
    return true;
}

export function sendGeneratorConfig(receiver: P2PMacAddress, config: GeneratorConfig[]): boolean {
    const store = new JsonSenderDataStore(config, DataTypes.kGeneratorConfig, "");
    const result = dataTransferController.sendRequest(receiver, store, []);
    if (result === null) {
        return false;
    }
    return true;
}

