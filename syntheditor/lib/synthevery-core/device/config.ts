import { DataTransferController } from "../data-transfer/data-transfer-controller";
import { ReceiverPortInterface, ReceiverSessionInterface, ReceiverDataStoreInterface } from "../data-transfer/interfaces";
import { DataType, RequestData, ResponseData } from "../types/data-transfer";
import { DataTypes, SessionID } from "../data-transfer/constants";
import { P2PMacAddress } from "../types/mesh";
import { JsonReceiverDataStore, JsonSenderDataStore } from "../data-transfer/json-store";
import { EventEmitter } from "eventemitter3";
import { NoteBuilderConfig, GeneratorConfig, TrackDetail, BodyColorConfig, LedColorConfig } from "../types/player";
import { ChordScaleConfig } from "../../../types/chordScale";

interface NoteBuilderConfigReceiverPortEvents {
    received: (json: any, sender: P2PMacAddress) => void;
}

interface GeneratorConfigReceiverPortEvents {
    received: (json: any, sender: P2PMacAddress) => void;
}

interface TrackDetailReceiverPortEvents {
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

export class TrackDetailReceiverPort implements ReceiverPortInterface {
    readonly eventEmitter = new EventEmitter<TrackDetailReceiverPortEvents>();

    getDataType(): DataType {
        return DataTypes.kTrackDetail;
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
        console.warn("TrackDetailReceiverPort: onStart session: ", session, "id: ", id);
    }

    onFinish(session: ReceiverSessionInterface, id: SessionID): void {
        console.warn("TrackDetailReceiverPort: onFinish session: ", session, "id: ", id);
    }
}

export function sendNoteBuilderConfig(dataTransferController: DataTransferController, receiver: P2PMacAddress, config: NoteBuilderConfig[]): boolean {
    const store = new JsonSenderDataStore(config, DataTypes.kNoteBuilderConfig, "");
    const result = dataTransferController.sendRequest(receiver, store, []);
    if (result === null) {
        return false;
    }
    return true;
}

export function sendGeneratorConfig(dataTransferController: DataTransferController, receiver: P2PMacAddress, config: GeneratorConfig[]): boolean {
    const store = new JsonSenderDataStore(config, DataTypes.kGeneratorConfig, "");
    const result = dataTransferController.sendRequest(receiver, store, []);
    if (result === null) {
        return false;
    }
    return true;
}

// --- Per-track partial updates ---
export function sendNoteBuilderConfigForTrack(dataTransferController: DataTransferController, receiver: P2PMacAddress, trackIndex: number, config: NoteBuilderConfig): boolean {
    const store = new JsonSenderDataStore(config, DataTypes.kNoteBuilderConfigTrack, String(trackIndex));
    const result = dataTransferController.sendRequest(receiver, store, []);
    if (result === null) {
        return false;
    }
    return true;
}

export function sendGeneratorConfigForTrack(dataTransferController: DataTransferController, receiver: P2PMacAddress, trackIndex: number, config: GeneratorConfig): boolean {
    const store = new JsonSenderDataStore(config, DataTypes.kGeneratorConfigTrack, String(trackIndex));
    const result = dataTransferController.sendRequest(receiver, store, []);
    if (result === null) {
        return false;
    }
    return true;
}

export function sendTrackDetail(dataTransferController: DataTransferController, receiver: P2PMacAddress, trackDetails: TrackDetail[]): boolean {
    const store = new JsonSenderDataStore(trackDetails, DataTypes.kTrackDetail, "");
    const result = dataTransferController.sendRequest(receiver, store, []);
    if (result === null) {
        return false;
    }
    return true;
}

interface BodyColorConfigReceiverPortEvents {
    received: (json: any, sender: P2PMacAddress) => void;
}

interface LedColorConfigReceiverPortEvents {
    received: (json: any, sender: P2PMacAddress) => void;
}

interface SettingsConfigReceiverPortEvents {
    received: (json: any, sender: P2PMacAddress, metadata: string) => void;
}

interface ChordScaleConfigReceiverPortEvents {
    received: (json: any, sender: P2PMacAddress) => void;
}

export class BodyColorConfigReceiverPort implements ReceiverPortInterface {
    readonly eventEmitter = new EventEmitter<BodyColorConfigReceiverPortEvents>();

    getDataType(): DataType {
        return DataTypes.kBodyColorConfig;
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
        console.warn("BodyColorConfigReceiverPort: onStart session: ", session, "id: ", id);
    }

    onFinish(session: ReceiverSessionInterface, id: SessionID): void {
        console.warn("BodyColorConfigReceiverPort: onFinish session: ", session, "id: ", id);
    }
}

export class LedColorConfigReceiverPort implements ReceiverPortInterface {
    readonly eventEmitter = new EventEmitter<LedColorConfigReceiverPortEvents>();

    getDataType(): DataType {
        return DataTypes.kLedColorConfig;
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
        console.warn("LedColorConfigReceiverPort: onStart session: ", session, "id: ", id);
    }

    onFinish(session: ReceiverSessionInterface, id: SessionID): void {
        console.warn("LedColorConfigReceiverPort: onFinish session: ", session, "id: ", id);
    }
}

export class SettingsConfigReceiverPort implements ReceiverPortInterface {
    readonly eventEmitter = new EventEmitter<SettingsConfigReceiverPortEvents>();

    getDataType(): DataType {
        return DataTypes.kSettingsConfig;
    }

    handleRequest(sender: P2PMacAddress, sessionId: SessionID, data: RequestData): { receiver: ReceiverDataStoreInterface, responseData: ResponseData } {
        const receiver = new JsonReceiverDataStore(data.totalSize, sender);
        receiver.eventEmitter.on('received', (json: any, sender: P2PMacAddress) => {
            // metadataには階層的パスが含まれている（例: "settings_core.player"）
            this.eventEmitter.emit('received', json, sender, data.metadata);
        });
        const responseData: ResponseData = {
            isAccepted: true,
            reason: 0
        };
        return { receiver, responseData };
    }

    onStart(session: ReceiverSessionInterface, id: SessionID): void {
        console.log("SettingsConfigReceiverPort: onStart session: ", session, "id: ", id);
    }

    onFinish(session: ReceiverSessionInterface, id: SessionID): void {
        console.log("SettingsConfigReceiverPort: onFinish session: ", session, "id: ", id);
    }
}

export class ChordScaleConfigReceiverPort implements ReceiverPortInterface {
    readonly eventEmitter = new EventEmitter<ChordScaleConfigReceiverPortEvents>();

    getDataType(): DataType {
        return DataTypes.kChordScaleConfig;
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
        console.log("ChordScaleConfigReceiverPort: onStart session: ", session, "id: ", id);
    }

    onFinish(session: ReceiverSessionInterface, id: SessionID): void {
        console.log("ChordScaleConfigReceiverPort: onFinish session: ", session, "id: ", id);
    }
}

export function sendBodyColorConfig(dataTransferController: DataTransferController, receiver: P2PMacAddress, config: BodyColorConfig): boolean {
    const store = new JsonSenderDataStore(config, DataTypes.kBodyColorConfig, "");
    const result = dataTransferController.sendRequest(receiver, store, []);
    if (result === null) {
        return false;
    }
    return true;
}

export function sendLedColorConfig(dataTransferController: DataTransferController, receiver: P2PMacAddress, config: LedColorConfig): boolean {
    const store = new JsonSenderDataStore(config, DataTypes.kLedColorConfig, "");
    const result = dataTransferController.sendRequest(receiver, store, []);
    if (result === null) {
        return false;
    }
    return true;
}

// Web -> Device 設定更新（任意JSON + ドット区切りメタデータ）
export function sendSettingsConfigUpdate(dataTransferController: DataTransferController, receiver: P2PMacAddress, namespaces: string[], json: any): boolean {
    const path = namespaces.join('.');
    // 要求に従い、送信DataTypeは kSettingsConfig を使用する
    const store = new JsonSenderDataStore(json, DataTypes.kSettingsConfig, path);
    const result = dataTransferController.sendRequest(receiver, store, []);
    if (result === null) {
        return false;
    }
    return true;
}

export function sendChordScaleConfig(dataTransferController: DataTransferController, receiver: P2PMacAddress, config: ChordScaleConfig): boolean {
    const store = new JsonSenderDataStore(config, DataTypes.kChordScaleConfig, "");
    const result = dataTransferController.sendRequest(receiver, store, []);
    if (result === null) {
        return false;
    }
    return true;
}

