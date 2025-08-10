import { mesh } from "../connection/mesh";
import { dataTransferController } from "../data-transfer/data-transfer-controller";
import { P2PMacAddress } from "../types/mesh";
import { NoteBuilderConfig, GeneratorConfig } from "../types/player";
import { NoteBuilderConfigReceiverPort, GeneratorConfigReceiverPort } from "./config";
import { getAddressString, getAddressFromString } from "../connection/util";
import { EventEmitter } from "eventemitter3";
import { deviceController } from "./controller";

interface DeviceConfigManagerEvents {
    configReceived: (device: P2PMacAddress, config: NoteBuilderConfig[]) => void;
    generatorConfigReceived: (device: P2PMacAddress, config: GeneratorConfig[]) => void;
    deviceConnected: (device: P2PMacAddress) => void;
    deviceDisconnected: (device: P2PMacAddress) => void;
}

class DeviceConfigManager {
    private deviceConfigs: Map<string, NoteBuilderConfig[]> = new Map();
    private generatorConfigs: Map<string, GeneratorConfig[]> = new Map();
    private noteBuilderConfigReceiverPort: NoteBuilderConfigReceiverPort;
    private generatorConfigReceiverPort: GeneratorConfigReceiverPort;
    readonly eventEmitter = new EventEmitter<DeviceConfigManagerEvents>();

    constructor() {
        this.noteBuilderConfigReceiverPort = new NoteBuilderConfigReceiverPort();
        this.generatorConfigReceiverPort = new GeneratorConfigReceiverPort();
        this.setupEventListeners();
        this.registerReceiverPort();

        // 初期化時に既存の接続デバイスに対してNoteBuilderConfigをリクエスト
        this.initializeExistingDevices();
    }

    private setupEventListeners(): void {
        // connectedDevicesChangedで初期化完了を確認（メイン処理）
        mesh.eventEmitter.on('connectedDevicesChanged', (devices: P2PMacAddress[], added: P2PMacAddress[], removed: P2PMacAddress[]) => {
            this.handleDevicesChanged(devices, added, removed);
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

        // データ転送セッション開始時の処理（デバッグ用）
        dataTransferController.getEventEmitter().on('sessionStart', (peer: P2PMacAddress, sessionId: number, type: string) => {
            if (type === 'receiver') {
                console.log('NoteBuilderConfig session started from:', getAddressString(peer), 'sessionId:', sessionId);
            }
        });
    }

    private registerReceiverPort(): void {
        dataTransferController.registerReceiverPort(this.noteBuilderConfigReceiverPort);
        dataTransferController.registerReceiverPort(this.generatorConfigReceiverPort);
    }



    private handleDevicesChanged(devices: P2PMacAddress[], added: P2PMacAddress[], removed: P2PMacAddress[]): void {
        // 新規追加されたデバイスに対してリクエストを送信
        added.forEach(device => {
            console.log('New device added:', getAddressString(device));
            this.requestNoteBuilderConfig(device);
            this.requestGeneratorConfig(device);
            this.eventEmitter.emit('deviceConnected', device);
        });

        // 切断されたデバイスの設定を削除
        removed.forEach(device => {
            console.log('Device removed:', getAddressString(device));
            this.removeDeviceConfig(device);
            this.removeGeneratorConfig(device);
            this.eventEmitter.emit('deviceDisconnected', device);
        });
    }

    // より堅牢な解決策: CommandHandlerの状態を直接監視
    // private async waitForCommandHandler(device: P2PMacAddress, maxRetries: number = 10): Promise<boolean> {
    //     for (let i = 0; i < maxRetries; i++) {
    //         const handler = commandDispatcher.getCommandHandler(device, false);
    //         if (handler && handler.hasClientInterface(COMMAND_CLIENT_ID_PLAYER_CONTROL)) {
    //             return true;
    //         }
    //         await new Promise(resolve => setTimeout(resolve, 50));
    //     }
    //     return false;
    // }

    private requestNoteBuilderConfig(device: P2PMacAddress): void {
        // webアプリ（自分自身）にはリクエストを送信しない
        const myAddress = mesh.getAddress();
        if (getAddressString(device) === getAddressString(myAddress)) {
            console.log('Skipping request to self:', getAddressString(device));
            return;
        }

        // NoteBuilderConfigのリクエストを送信
        deviceController.requestNoteBuilderConfig(device);
        console.log('Requesting NoteBuilderConfig from device:', getAddressString(device));
    }

    private requestGeneratorConfig(device: P2PMacAddress): void {
        // webアプリ（自分自身）にはリクエストを送信しない
        const myAddress = mesh.getAddress();
        if (getAddressString(device) === getAddressString(myAddress)) {
            console.log('Skipping GeneratorConfig request to self:', getAddressString(device));
            return;
        }

        // GeneratorConfigのリクエストを送信
        deviceController.requestGeneratorConfig(device);
        console.log('Requesting GeneratorConfig from device:', getAddressString(device));
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



    private saveReceivedConfig(config: NoteBuilderConfig[], sender: P2PMacAddress): void {
        // 受信した設定を送信元デバイスに保存
        const senderStr = getAddressString(sender);
        this.deviceConfigs.set(senderStr, config);
        console.log('Saved config for device:', senderStr, 'config:', config);

        // イベントを発火
        this.eventEmitter.emit('configReceived', sender, config);
    }

    private saveReceivedGeneratorConfig(config: GeneratorConfig[], sender: P2PMacAddress): void {
        // 受信した設定を送信元デバイスに保存
        const senderStr = getAddressString(sender);
        this.generatorConfigs.set(senderStr, config);
        console.log('Saved generator config for device:', senderStr, 'config:', config);

        // イベントを発火
        this.eventEmitter.emit('generatorConfigReceived', sender, config);
    }

    private initializeExistingDevices(): void {
        // 初期化時に既存の接続デバイスに対してNoteBuilderConfigをリクエスト
        const existingDevices = mesh.getConnectedDevices();
        const myAddress = mesh.getAddress();

        existingDevices.forEach(device => {
            // webアプリ（自分自身）にはリクエストを送信しない
            if (getAddressString(device) !== getAddressString(myAddress)) {
                this.requestNoteBuilderConfig(device);
                this.requestGeneratorConfig(device);
            }
        });
        console.log('Initialized with existing devices:', existingDevices.map(d => getAddressString(d)));
    }

    getConfig(device: P2PMacAddress): NoteBuilderConfig[] | undefined {
        return this.deviceConfigs.get(getAddressString(device));
    }

    getGeneratorConfig(device: P2PMacAddress): GeneratorConfig[] | undefined {
        return this.generatorConfigs.get(getAddressString(device));
    }

    getAllConfigs(): Map<string, NoteBuilderConfig[]> {
        return new Map(this.deviceConfigs);
    }

    getAllGeneratorConfigs(): Map<string, GeneratorConfig[]> {
        return new Map(this.generatorConfigs);
    }


}

export const deviceConfigManager = new DeviceConfigManager(); 