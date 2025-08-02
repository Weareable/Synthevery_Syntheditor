import { mesh } from "../connection/mesh";
import { dataTransferController } from "../data-transfer/data-transfer-controller";
import { P2PMacAddress } from "../types/mesh";
import { NoteBuilderConfig } from "../types/player";
import { NoteBuilderConfigReceiverPort } from "./config";
import { getAddressString, getAddressFromString } from "../connection/util";
import { EventEmitter } from "eventemitter3";
import { playerController } from "./controller";

interface DeviceConfigManagerEvents {
    configReceived: (device: P2PMacAddress, config: NoteBuilderConfig[]) => void;
    deviceConnected: (device: P2PMacAddress) => void;
    deviceDisconnected: (device: P2PMacAddress) => void;
}

class DeviceConfigManager {
    private deviceConfigs: Map<string, NoteBuilderConfig[]> = new Map();
    private noteBuilderConfigReceiverPort: NoteBuilderConfigReceiverPort;
    readonly eventEmitter = new EventEmitter<DeviceConfigManagerEvents>();

    constructor() {
        this.noteBuilderConfigReceiverPort = new NoteBuilderConfigReceiverPort();
        this.setupEventListeners();
        this.registerReceiverPort();

        // 初期化時に既存の接続デバイスに対してNoteBuilderConfigをリクエスト
        this.initializeExistingDevices();
    }

    private setupEventListeners(): void {
        // デバイス接続時の処理
        mesh.eventEmitter.on('connected', (device: P2PMacAddress) => {
            console.log('Device connected:', getAddressString(device));
            // 初期化完了を待つため少し遅延
            setTimeout(() => {
                this.requestNoteBuilderConfig(device);
            }, 100);
            this.eventEmitter.emit('deviceConnected', device);
        });

        // デバイス切断時の処理
        mesh.eventEmitter.on('disconnected', (device: P2PMacAddress) => {
            console.log('Device disconnected:', getAddressString(device));
            this.removeDeviceConfig(device);
            this.eventEmitter.emit('deviceDisconnected', device);
        });

        // NoteBuilderConfig受信時の処理
        this.noteBuilderConfigReceiverPort.eventEmitter.on('received', (config: NoteBuilderConfig[], sender: P2PMacAddress) => {
            // 受信した設定を保存（送信元デバイスが特定できました！）
            console.log('Received NoteBuilderConfig from:', getAddressString(sender), 'config:', config);
            this.saveReceivedConfig(config, sender);
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
    }



    private requestNoteBuilderConfig(device: P2PMacAddress): void {
        // webアプリ（自分自身）にはリクエストを送信しない
        const myAddress = mesh.getAddress();
        if (getAddressString(device) === getAddressString(myAddress)) {
            console.log('Skipping request to self:', getAddressString(device));
            return;
        }

        // NoteBuilderConfigのリクエストを送信
        playerController.requestNoteBuilderConfig(device);
        console.log('Requesting NoteBuilderConfig from device:', getAddressString(device));
    }

    private removeDeviceConfig(device: P2PMacAddress): void {
        const deviceStr = getAddressString(device);
        this.deviceConfigs.delete(deviceStr);
        console.log('Removed config for device:', deviceStr);
    }



    private saveReceivedConfig(config: NoteBuilderConfig[], sender: P2PMacAddress): void {
        // 受信した設定を送信元デバイスに保存
        const senderStr = getAddressString(sender);
        this.deviceConfigs.set(senderStr, config);
        console.log('Saved config for device:', senderStr, 'config:', config);

        // イベントを発火
        this.eventEmitter.emit('configReceived', sender, config);
    }

    private initializeExistingDevices(): void {
        // 初期化時に既存の接続デバイスに対してNoteBuilderConfigをリクエスト
        const existingDevices = mesh.getConnectedDevices();
        const myAddress = mesh.getAddress();

        existingDevices.forEach(device => {
            // webアプリ（自分自身）にはリクエストを送信しない
            if (getAddressString(device) !== getAddressString(myAddress)) {
                this.requestNoteBuilderConfig(device);
            }
        });
        console.log('Initialized with existing devices:', existingDevices.map(d => getAddressString(d)));
    }

    getConfig(device: P2PMacAddress): NoteBuilderConfig[] | undefined {
        return this.deviceConfigs.get(getAddressString(device));
    }

    getAllConfigs(): Map<string, NoteBuilderConfig[]> {
        return new Map(this.deviceConfigs);
    }


}

export const deviceConfigManager = new DeviceConfigManager(); 