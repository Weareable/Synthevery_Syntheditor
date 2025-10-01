import { Mesh } from "../connection/mesh";
import { DataTransferController } from "../data-transfer/data-transfer-controller";
import { ReceiverPortInterface, ReceiverSessionInterface, ReceiverDataStoreInterface } from "../data-transfer/interfaces";
import { DataType, RequestData, ResponseData } from "../types/data-transfer";
import { DataTypes, SessionID } from "../data-transfer/constants";
import { P2PMacAddress } from "../types/mesh";
import { JsonReceiverDataStore, JsonSenderDataStore } from "../data-transfer/json-store";
import { EventEmitter } from "eventemitter3";
import { NoteBuilderConfig, GeneratorConfig, TrackDetail, BodyColorConfig, LedColorConfig } from "../types/player";
import { ChordScaleConfig } from "../../../types/chordScale";
import {
    NoteBuilderConfigReceiverPort,
    GeneratorConfigReceiverPort,
    TrackDetailReceiverPort,
    BodyColorConfigReceiverPort,
    LedColorConfigReceiverPort,
    SettingsConfigReceiverPort,
    ChordScaleConfigReceiverPort
} from "./config";
import { DeviceController } from "./controller";
import { getAddressString } from "../connection/util";

interface DeviceConfigManagerEvents {
    deviceConnected: (device: P2PMacAddress) => void;
    deviceDisconnected: (device: P2PMacAddress) => void;
    noteBuilderConfigReceived: (device: P2PMacAddress, config: NoteBuilderConfig[]) => void;
    generatorConfigReceived: (device: P2PMacAddress, config: GeneratorConfig[]) => void;
    trackDetailReceived: (device: P2PMacAddress, config: TrackDetail[]) => void;
    bodyColorConfigReceived: (device: P2PMacAddress, config: BodyColorConfig) => void;
    ledColorConfigReceived: (device: P2PMacAddress, config: LedColorConfig) => void;
    settingsConfigReceived: (device: P2PMacAddress, config: any) => void;
    chordScaleConfigReceived: (device: P2PMacAddress, config: ChordScaleConfig) => void;
}

export class DeviceConfigManager {
    private mesh: Mesh;
    private dataTransferController: DataTransferController;
    private deviceController: DeviceController;
    private deviceConfigs: Map<string, NoteBuilderConfig[]> = new Map();
    private generatorConfigs: Map<string, GeneratorConfig[]> = new Map();
    private trackDetails: Map<string, TrackDetail[]> = new Map();
    private bodyColorConfigs: Map<string, BodyColorConfig> = new Map();
    private ledColorConfigs: Map<string, LedColorConfig> = new Map();
    private settingsConfigs: Map<string, any> = new Map();
    private chordScaleConfigs: Map<string, ChordScaleConfig> = new Map();

    private noteBuilderConfigReceiverPort: NoteBuilderConfigReceiverPort;
    private generatorConfigReceiverPort: GeneratorConfigReceiverPort;
    private trackDetailReceiverPort: TrackDetailReceiverPort;
    private bodyColorConfigReceiverPort: BodyColorConfigReceiverPort;
    private ledColorConfigReceiverPort: LedColorConfigReceiverPort;
    private settingsConfigReceiverPort: SettingsConfigReceiverPort;
    private chordScaleConfigReceiverPort: ChordScaleConfigReceiverPort;
    readonly eventEmitter = new EventEmitter<DeviceConfigManagerEvents>();

    constructor(mesh: Mesh, dataTransferController: DataTransferController, deviceController: DeviceController) {
        this.mesh = mesh;
        this.dataTransferController = dataTransferController;
        this.deviceController = deviceController;

        this.noteBuilderConfigReceiverPort = new NoteBuilderConfigReceiverPort();
        this.generatorConfigReceiverPort = new GeneratorConfigReceiverPort();
        this.trackDetailReceiverPort = new TrackDetailReceiverPort();
        this.bodyColorConfigReceiverPort = new BodyColorConfigReceiverPort();
        this.ledColorConfigReceiverPort = new LedColorConfigReceiverPort();
        this.settingsConfigReceiverPort = new SettingsConfigReceiverPort();
        this.chordScaleConfigReceiverPort = new ChordScaleConfigReceiverPort();

        this.setupEventListeners();
        this.registerReceiverPort();

        // 初期化時に既存の接続デバイスに対してNoteBuilderConfigをリクエスト
        this.initializeExistingDevices();
    }

    private setupEventListeners(): void {
        // connectedDevicesChangedで初期化完了を確認（メイン処理）
        // 直接接続ピアのみを対象とするため、connectedPeersChangedイベントを使用
        this.mesh.eventEmitter.on('connectedDevicesChanged', (devices: P2PMacAddress[], added: P2PMacAddress[], removed: P2PMacAddress[]) => {
            // 直接接続ピアのみをフィルタリング
            const connectedPeers = this.mesh.getConnectedPeers();
            const addedPeers = added.filter(device =>
                connectedPeers.some(peer => getAddressString(device) === getAddressString(peer))
            );
            const removedPeers = removed.filter(device =>
                connectedPeers.some(peer => getAddressString(device) === getAddressString(peer))
            );

            this.handleDevicesChanged(devices, addedPeers, removedPeers);
        });

        // NoteBuilderConfig受信時の処理
        this.noteBuilderConfigReceiverPort.eventEmitter.on('received', (config: NoteBuilderConfig[], sender: P2PMacAddress) => {
            // 受信した設定を保存（送信元デバイスが特定できました！）
            console.log('Received NoteBuilderConfig from:', getAddressString(sender), 'config:', config);
            this.saveReceivedConfig(config, sender);
        });

        // GeneratorConfig受信時の処理
        this.generatorConfigReceiverPort.eventEmitter.on('received', (config: GeneratorConfig[], sender: P2PMacAddress) => {
            // 受信した設定を保存
            console.log('Received GeneratorConfig from:', getAddressString(sender), 'config:', config);
            this.saveReceivedGeneratorConfig(config, sender);
        });

        // TrackDetail受信時の処理
        this.trackDetailReceiverPort.eventEmitter.on('received', (trackDetails: TrackDetail[], sender: P2PMacAddress) => {
            // 受信したTrackDetailを保存
            console.log('Received TrackDetail from:', getAddressString(sender), 'trackDetails:', trackDetails);
            this.saveReceivedTrackDetail(trackDetails, sender);
        });

        // BodyColorConfig受信時の処理
        this.bodyColorConfigReceiverPort.eventEmitter.on('received', (config: BodyColorConfig, sender: P2PMacAddress) => {
            // 受信した本体色設定を保存
            console.log('Received BodyColorConfig from:', getAddressString(sender), 'config:', config);
            this.saveReceivedBodyColorConfig(config, sender);
        });

        // LedColorConfig受信時の処理
        this.ledColorConfigReceiverPort.eventEmitter.on('received', (config: LedColorConfig, sender: P2PMacAddress) => {
            // 受信したLED色設定を保存
            console.log('Received LedColorConfig from:', getAddressString(sender), 'config:', config);
            this.saveReceivedLedColorConfig(config, sender);
        });

        // SettingsConfig受信時の処理
        this.settingsConfigReceiverPort.eventEmitter.on('received', (config: any, sender: P2PMacAddress) => {
            // 受信した設定を保存
            console.log('Received SettingsConfig from:', getAddressString(sender), 'config:', config);
            this.saveReceivedSettingsConfig(config, sender);
        });

        // ChordScaleConfig受信時の処理
        this.chordScaleConfigReceiverPort.eventEmitter.on('received', (config: ChordScaleConfig, sender: P2PMacAddress) => {
            // 受信したコード進行設定を保存
            console.log('Received ChordScaleConfig from:', getAddressString(sender), 'config:', config);
            this.saveReceivedChordScaleConfig(config, sender);
        });

        // データ転送セッション開始時の処理（デバッグ用）
        this.dataTransferController.getEventEmitter().on('sessionStart', (peer: P2PMacAddress, sessionId: number, type: string) => {
            if (type === 'receiver') {
                console.log('NoteBuilderConfig session started from:', getAddressString(peer), 'sessionId:', sessionId);
            }
        });
    }

    private registerReceiverPort(): void {
        this.dataTransferController.registerReceiverPort(this.noteBuilderConfigReceiverPort);
        this.dataTransferController.registerReceiverPort(this.generatorConfigReceiverPort);
        this.dataTransferController.registerReceiverPort(this.trackDetailReceiverPort);
        this.dataTransferController.registerReceiverPort(this.bodyColorConfigReceiverPort);
        this.dataTransferController.registerReceiverPort(this.ledColorConfigReceiverPort);
        this.dataTransferController.registerReceiverPort(this.settingsConfigReceiverPort);
        this.dataTransferController.registerReceiverPort(this.chordScaleConfigReceiverPort);
    }

    private handleDevicesChanged(devices: P2PMacAddress[], added: P2PMacAddress[], removed: P2PMacAddress[]): void {
        // 新規追加されたデバイスに対してリクエストを送信
        added.forEach(device => {
            console.log('New device added:', getAddressString(device));
            const configRequests = [
                () => this.requestNoteBuilderConfig(device),
                () => this.requestGeneratorConfig(device),
                () => this.requestTrackDetail(device),
                () => this.requestBodyColorConfig(device),
                () => this.requestLedColorConfig(device),
                () => this.requestSettingsConfig(device, ['player']),
                () => this.requestChordScaleConfig(device)
            ];

            const delay = (fn: () => void, ms: number) => new Promise<void>(resolve => {
                setTimeout(() => {
                    fn();
                    resolve();
                }, ms);
            });

            (async () => {
                for (const req of configRequests) {
                    await delay(req, 1000);
                }
                this.eventEmitter.emit('deviceConnected', device);
            })();
        });

        // 切断されたデバイスの設定を削除
        removed.forEach(device => {
            console.log('Device removed:', getAddressString(device));
            this.removeDeviceConfig(device);
            this.removeGeneratorConfig(device);
            this.removeTrackDetail(device);
            this.removeBodyColorConfig(device);
            this.removeLedColorConfig(device);
            this.removeSettingsConfig(device); // 切断時も設定を削除
            this.removeChordScaleConfig(device);
            this.eventEmitter.emit('deviceDisconnected', device);
        });
    }

    private requestNoteBuilderConfig(device: P2PMacAddress): void {
        // webアプリ（自分自身）にはリクエストを送信しない
        const myAddress = this.mesh.getAddress();
        if (getAddressString(device) === getAddressString(myAddress)) {
            console.log('Skipping request to self:', getAddressString(device));
            return;
        }

        // NoteBuilderConfigのリクエストを送信
        this.deviceController.requestNoteBuilderConfig(device);
        console.log('Requesting NoteBuilderConfig from device:', getAddressString(device));
    }

    private requestGeneratorConfig(device: P2PMacAddress): void {
        // webアプリ（自分自身）にはリクエストを送信しない
        const myAddress = this.mesh.getAddress();
        if (getAddressString(device) === getAddressString(myAddress)) {
            console.log('Skipping GeneratorConfig request to self:', getAddressString(device));
            return;
        }

        // GeneratorConfigのリクエストを送信
        this.deviceController.requestGeneratorConfig(device);
        console.log('Requesting GeneratorConfig from device:', getAddressString(device));
    }

    private requestTrackDetail(device: P2PMacAddress): void {
        // webアプリ（自分自身）にはリクエストを送信しない
        const myAddress = this.mesh.getAddress();
        if (getAddressString(device) === getAddressString(myAddress)) {
            console.log('Skipping TrackDetail request to self:', getAddressString(device));
            return;
        }

        // TrackDetailのリクエストを送信
        this.deviceController.requestTrackDetail(device);
        console.log('Requesting TrackDetail from device:', getAddressString(device));
    }

    private requestBodyColorConfig(device: P2PMacAddress): void {
        // webアプリ（自分自身）にはリクエストを送信しない
        const myAddress = this.mesh.getAddress();
        if (getAddressString(device) === getAddressString(myAddress)) {
            console.log('Skipping BodyColorConfig request to self:', getAddressString(device));
            return;
        }

        // BodyColorConfigのリクエストを送信
        this.deviceController.requestBodyColorConfig(device);
        console.log('Requesting BodyColorConfig from device:', getAddressString(device));
    }

    private requestLedColorConfig(device: P2PMacAddress): void {
        // webアプリ（自分自身）にはリクエストを送信しない
        const myAddress = this.mesh.getAddress();
        if (getAddressString(device) === getAddressString(myAddress)) {
            console.log('Skipping LedColorConfig request to self:', getAddressString(device));
            return;
        }

        // LedColorConfigのリクエストを送信
        this.deviceController.requestLedColorConfig(device);
        console.log('Requesting LedColorConfig from device:', getAddressString(device));
    }

    private requestSettingsConfig(device: P2PMacAddress, namespaces: string[]): void {
        // webアプリ（自分自身）にはリクエストを送信しない
        const myAddress = this.mesh.getAddress();
        if (getAddressString(device) === getAddressString(myAddress)) {
            console.log('Skipping SettingsConfig request to self:', getAddressString(device));
            return;
        }

        // SettingsConfigのリクエストを送信
        this.deviceController.requestSettingsConfig(device, namespaces);
        console.log('Requesting SettingsConfig from device:', getAddressString(device), 'namespaces:', namespaces);
    }

    private removeDeviceConfig(device: P2PMacAddress): void {
        const deviceStr = getAddressString(device);
        this.deviceConfigs.delete(deviceStr);
        console.log('Removed config for device:', deviceStr);
    }

    private removeGeneratorConfig(device: P2PMacAddress): void {
        const deviceStr = getAddressString(device);
        this.generatorConfigs.delete(deviceStr);
        console.log('Removed generator config for device:', deviceStr);
    }

    private removeTrackDetail(device: P2PMacAddress): void {
        const deviceStr = getAddressString(device);
        this.trackDetails.delete(deviceStr);
        console.log('Removed track detail for device:', deviceStr);
    }

    private removeBodyColorConfig(device: P2PMacAddress): void {
        const deviceStr = getAddressString(device);
        this.bodyColorConfigs.delete(deviceStr);
        console.log('Removed BodyColorConfig for device:', deviceStr);
    }

    private removeLedColorConfig(device: P2PMacAddress): void {
        const deviceStr = getAddressString(device);
        this.ledColorConfigs.delete(deviceStr);
        console.log('Removed LedColorConfig for device:', deviceStr);
    }

    private removeSettingsConfig(device: P2PMacAddress): void {
        const deviceStr = getAddressString(device);
        this.settingsConfigs.delete(deviceStr);
        console.log('Removed SettingsConfig for device:', deviceStr);
    }

    private saveReceivedConfig(config: NoteBuilderConfig[], sender: P2PMacAddress): void {
        // 受信した設定を送信元デバイスに保存
        const senderStr = getAddressString(sender);
        this.deviceConfigs.set(senderStr, config);
        console.log('Saved config for device:', senderStr, 'config:', config);

        // イベントを発火
        this.eventEmitter.emit('noteBuilderConfigReceived', sender, config);
    }

    private saveReceivedGeneratorConfig(config: GeneratorConfig[], sender: P2PMacAddress): void {
        // 受信した設定を送信元デバイスに保存
        const senderStr = getAddressString(sender);
        this.generatorConfigs.set(senderStr, config);
        console.log('Saved generator config for device:', senderStr, 'config:', config);

        // イベントを発火
        this.eventEmitter.emit('generatorConfigReceived', sender, config);
    }

    private saveReceivedTrackDetail(trackDetails: TrackDetail[], sender: P2PMacAddress): void {
        // 受信したTrackDetailを送信元デバイスに保存
        const senderStr = getAddressString(sender);
        this.trackDetails.set(senderStr, trackDetails);
        console.log('Saved track detail for device:', senderStr, 'trackDetails:', trackDetails);

        // イベントを発火
        this.eventEmitter.emit('trackDetailReceived', sender, trackDetails);
    }

    private saveReceivedBodyColorConfig(config: BodyColorConfig, sender: P2PMacAddress): void {
        const senderStr = getAddressString(sender);
        this.bodyColorConfigs.set(senderStr, config);
        console.log('Saved BodyColorConfig for device:', senderStr, 'config:', config);
        this.eventEmitter.emit('bodyColorConfigReceived', sender, config);
    }

    private saveReceivedLedColorConfig(config: LedColorConfig, sender: P2PMacAddress): void {
        const senderStr = getAddressString(sender);
        this.ledColorConfigs.set(senderStr, config);
        console.log('Saved LedColorConfig for device:', senderStr, 'config:', config);
        this.eventEmitter.emit('ledColorConfigReceived', sender, config);
    }

    private saveReceivedSettingsConfig(config: any, sender: P2PMacAddress): void {
        const senderStr = getAddressString(sender);
        this.settingsConfigs.set(senderStr, config);
        console.log('Saved SettingsConfig for device:', senderStr, 'config:', config);
        this.eventEmitter.emit('settingsConfigReceived', sender, config);
    }

    private initializeExistingDevices(): void {
        // 初期化時に直接接続ピアのみに対して設定をリクエスト
        const connectedPeers = this.mesh.getConnectedPeers();
        const myAddress = this.mesh.getAddress();

        connectedPeers.forEach(device => {
            // webアプリ（自分自身）にはリクエストを送信しない
            if (getAddressString(device) !== getAddressString(myAddress)) {
                this.requestNoteBuilderConfig(device);
                this.requestGeneratorConfig(device);
                this.requestTrackDetail(device);
                this.requestBodyColorConfig(device);
                this.requestLedColorConfig(device);
                this.requestSettingsConfig(device, ['player']); // 既存接続時も設定をリクエスト
                this.requestChordScaleConfig(device);
            }
        });
        console.log('Initialized with connected peers:', connectedPeers.map(d => getAddressString(d)));
    }

    getConfig(device: P2PMacAddress): NoteBuilderConfig[] | undefined {
        return this.deviceConfigs.get(getAddressString(device));
    }

    getGeneratorConfig(device: P2PMacAddress): GeneratorConfig[] | undefined {
        return this.generatorConfigs.get(getAddressString(device));
    }

    getTrackDetail(device: P2PMacAddress): TrackDetail[] | undefined {
        return this.trackDetails.get(getAddressString(device));
    }

    getBodyColorConfig(device: P2PMacAddress): BodyColorConfig | undefined {
        return this.bodyColorConfigs.get(getAddressString(device));
    }

    getLedColorConfig(device: P2PMacAddress): LedColorConfig | undefined {
        return this.ledColorConfigs.get(getAddressString(device));
    }

    getAllConfigs(): Map<string, NoteBuilderConfig[]> {
        return new Map(this.deviceConfigs);
    }

    getAllGeneratorConfigs(): Map<string, GeneratorConfig[]> {
        return new Map(this.generatorConfigs);
    }

    getAllTrackDetails(): Map<string, TrackDetail[]> {
        return new Map(this.trackDetails);
    }

    getAllBodyColorConfigs(): Map<string, BodyColorConfig> {
        return new Map(this.bodyColorConfigs);
    }

    getAllLedColorConfigs(): Map<string, LedColorConfig> {
        return new Map(this.ledColorConfigs);
    }

    getChordScaleConfig(device: P2PMacAddress): ChordScaleConfig | undefined {
        return this.chordScaleConfigs.get(getAddressString(device));
    }

    getAllChordScaleConfigs(): Map<string, ChordScaleConfig> {
        return new Map(this.chordScaleConfigs);
    }

    getAllSettingsConfigs(): Map<string, any> {
        return new Map(this.settingsConfigs);
    }

    getSettingsConfig(device: string): any | undefined {
        return this.settingsConfigs.get(device);
    }

    private requestChordScaleConfig(device: P2PMacAddress): void {
        // webアプリ（自分自身）にはリクエストを送信しない
        const myAddress = this.mesh.getAddress();
        if (getAddressString(device) === getAddressString(myAddress)) {
            console.log('Skipping ChordScaleConfig request to self:', getAddressString(device));
            return;
        }

        console.log('Requesting ChordScaleConfig from:', getAddressString(device));
        setTimeout(() => {
            this.deviceController.requestChordScaleConfig(device);
        }, 100); // 100ms遅延でhandler初期化完了を待機
    }

    private saveReceivedChordScaleConfig(config: ChordScaleConfig, sender: P2PMacAddress): void {
        const deviceStr = getAddressString(sender);
        this.chordScaleConfigs.set(deviceStr, config);
        this.eventEmitter.emit('chordScaleConfigReceived', sender, config);
    }

    private removeChordScaleConfig(device: P2PMacAddress): void {
        const deviceStr = getAddressString(device);
        this.chordScaleConfigs.delete(deviceStr);
    }
}

// シングルトンインスタンスの即座生成を停止
// export const deviceConfigManager = new DeviceConfigManager(); 