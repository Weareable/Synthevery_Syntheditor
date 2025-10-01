import { EventEmitter } from 'eventemitter3';
import { DeviceConfigManager } from '../device/device-config-manager';
import { P2PMacAddress } from '../types/mesh';
import {
    TrackDetail,
    NoteBuilderConfig,
    GeneratorConfig
} from '../types/player';
import { getAddressString, getAddressFromString } from '../connection/util';
import { Mesh } from '../connection/mesh';

/**
 * トラックコンフィグ管理のイベント
 */
export interface TrackConfigManagerEvents {
    // 新規デバイス接続時のコンフィグ同期イベント
    configSyncRequired: (device: P2PMacAddress, missingConfigs: string[]) => void;

    // コンフィグ同期完了イベント
    configSyncCompleted: (device: P2PMacAddress) => void;

    // アプリコンフィグ変更イベント
    appConfigChanged: (configType: 'trackDetail' | 'noteBuilder' | 'generator', trackIndex: number) => void;

    // デバイスコンフィグ変更イベント
    deviceConfigChanged: (device: P2PMacAddress, configType: string, trackIndex: number) => void;
}

/**
 * トラックコンフィグ管理クラス
 * 各デバイスのTrackDetail、NoteBuilderConfig、GeneratorConfigを統合管理
 */
export class TrackConfigManager extends EventEmitter<TrackConfigManagerEvents> {
    private mesh: Mesh;
    private deviceConfigManager: DeviceConfigManager;
    // アプリで保持する統合コンフィグ（最初に接続されたデバイスのコンフィグをベース）
    private appTrackDetails: TrackDetail[] = [];
    private appNoteBuilderConfigs: NoteBuilderConfig[] = [];
    private appGeneratorConfigs: GeneratorConfig[] = [];

    // 各デバイスのコンフィグ状態を追跡
    private deviceConfigStatus: Map<string, {
        trackDetail: boolean;
        noteBuilder: boolean;
        generator: boolean;
    }> = new Map();

    // 初期化完了フラグ
    private hasInitialDevice = false;

    // 各コンフィグタイプの初期受信状態を追跡
    private initialConfigReceived = {
        trackDetail: false,
        noteBuilder: false,
        generator: false
    };

    constructor(mesh: Mesh, deviceConfigManager: DeviceConfigManager) {
        super();
        this.mesh = mesh;
        this.deviceConfigManager = deviceConfigManager;
        this.setupDeviceConfigManagerListeners();
        this.initializeDefaultConfigs();
    }

    /**
     * deviceConfigManagerのイベントリスナーを設定
     */
    private setupDeviceConfigManagerListeners(): void {
        // TrackDetail受信時の処理
        this.deviceConfigManager.eventEmitter.on('trackDetailReceived', (device: P2PMacAddress, trackDetails: TrackDetail[]) => {
            this.handleTrackDetailReceived(device, trackDetails);
        });

        // NoteBuilderConfig受信時の処理
        this.deviceConfigManager.eventEmitter.on('noteBuilderConfigReceived', (device: P2PMacAddress, configs: NoteBuilderConfig[]) => {
            this.handleNoteBuilderConfigReceived(device, configs);
        });

        // GeneratorConfig受信時の処理
        this.deviceConfigManager.eventEmitter.on('generatorConfigReceived', (device: P2PMacAddress, configs: GeneratorConfig[]) => {
            this.handleGeneratorConfigReceived(device, configs);
        });

        // デバイス接続時の処理
        this.deviceConfigManager.eventEmitter.on('deviceConnected', (device: P2PMacAddress) => {
            this.handleDeviceConnected(device);
        });

        // デバイス切断時の処理
        this.deviceConfigManager.eventEmitter.on('deviceDisconnected', (device: P2PMacAddress) => {
            this.handleDeviceDisconnected(device);
        });
    }

    /**
     * デフォルトコンフィグの初期化
     */
    private initializeDefaultConfigs(): void {
        // 実際のデバイスコンフィグが受信されるまでready状態にしない
        this.hasInitialDevice = false;
        this.initialConfigReceived = {
            trackDetail: false,
            noteBuilder: false,
            generator: false
        };
        console.log('TrackConfigManager: Default configs initialized, waiting for device configs');
    }

    /**
     * TrackDetail受信時の処理
     */
    private handleTrackDetailReceived(device: P2PMacAddress, trackDetails: TrackDetail[]): void {
        const deviceStr = getAddressString(device);

        // アプリのMACアドレス（自分自身）からのコンフィグは除外
        const myAddress = this.mesh.getAddress();
        console.log('TrackConfigManager: TrackDetail received from device:', deviceStr, 'myAddress:', getAddressString(myAddress), 'isSelf:', getAddressString(device) === getAddressString(myAddress));
        if (getAddressString(device) === getAddressString(myAddress)) {
            console.log('TrackConfigManager: Skipping TrackDetail from self:', deviceStr);
            return;
        }

        console.log('TrackConfigManager: TrackDetail received:', trackDetails);

        // デバイスのコンフィグ状態を更新
        this.updateDeviceConfigStatus(deviceStr, 'trackDetail', true);

        // アプリコンフィグを同期
        this.syncAppConfigFromDevice('trackDetail', trackDetails);

        // 初期受信状態を更新
        if (!this.initialConfigReceived.trackDetail) {
            this.initialConfigReceived.trackDetail = true;
            console.log('TrackConfigManager: TrackDetail initial config received');
            this.checkInitializationComplete();
        }

        // コンフィグ同期が必要かチェック
        this.checkConfigSyncRequired(device);

        // コンフィグ同期完了イベントを発火
        console.log('TrackConfigManager: Emitting configSyncCompleted event for device:', deviceStr);
        this.emit('configSyncCompleted', device);
    }

    /**
     * NoteBuilderConfig受信時の処理
     */
    private handleNoteBuilderConfigReceived(device: P2PMacAddress, configs: NoteBuilderConfig[]): void {
        const deviceStr = getAddressString(device);

        // アプリのMACアドレス（自分自身）からのコンフィグは除外
        const myAddress = this.mesh.getAddress();
        console.log('TrackConfigManager: NoteBuilderConfig received from device:', deviceStr, 'myAddress:', getAddressString(myAddress), 'isSelf:', getAddressString(device) === getAddressString(myAddress));
        if (getAddressString(device) === getAddressString(myAddress)) {
            console.log('TrackConfigManager: Skipping NoteBuilderConfig from self:', deviceStr);
            return;
        }

        // デバイスのコンフィグ状態を更新
        this.updateDeviceConfigStatus(deviceStr, 'noteBuilder', true);

        // アプリコンフィグを同期
        this.syncAppConfigFromDevice('noteBuilder', configs);

        // 初期受信状態を更新
        if (!this.initialConfigReceived.noteBuilder) {
            this.initialConfigReceived.noteBuilder = true;
            console.log('TrackConfigManager: NoteBuilderConfig initial config received');
            this.checkInitializationComplete();
        }

        // コンフィグ同期が必要かチェック
        this.checkConfigSyncRequired(device);

        // コンフィグ同期完了イベントを発火
        console.log('TrackConfigManager: Emitting configSyncCompleted event for device:', deviceStr);
        this.emit('configSyncCompleted', device);
    }

    /**
     * GeneratorConfig受信時の処理
     */
    private handleGeneratorConfigReceived(device: P2PMacAddress, configs: GeneratorConfig[]): void {
        const deviceStr = getAddressString(device);

        // アプリのMACアドレス（自分自身）からのコンフィグは除外
        const myAddress = this.mesh.getAddress();
        console.log('TrackConfigManager: GeneratorConfig received from device:', deviceStr, 'myAddress:', getAddressString(myAddress), 'isSelf:', getAddressString(myAddress));
        if (getAddressString(device) === getAddressString(myAddress)) {
            console.log('TrackConfigManager: Skipping GeneratorConfig from self:', deviceStr);
            return;
        }

        // デバイスのコンフィグ状態を更新
        this.updateDeviceConfigStatus(deviceStr, 'generator', true);

        // アプリコンフィグを同期
        this.syncAppConfigFromDevice('generator', configs);

        // 初期受信状態を更新
        if (!this.initialConfigReceived.generator) {
            this.initialConfigReceived.generator = true;
            console.log('TrackConfigManager: GeneratorConfig initial config received');
            this.checkInitializationComplete();
        }

        // コンフィグ同期が必要かチェック
        this.checkConfigSyncRequired(device);

        // コンフィグ同期完了イベントを発火
        console.log('TrackConfigManager: Emitting configSyncCompleted event for device:', deviceStr);
        this.emit('configSyncCompleted', device);
    }

    /**
     * デバイス接続時の処理
     */
    private handleDeviceConnected(device: P2PMacAddress): void {
        const deviceStr = getAddressString(device);

        // アプリのMACアドレス（自分自身）は除外
        const myAddress = this.mesh.getAddress();
        if (getAddressString(device) === getAddressString(myAddress)) {
            console.log('TrackConfigManager: Skipping device connection from self:', deviceStr);
            return;
        }

        console.log('TrackConfigManager: Device connected:', deviceStr, 'hasInitialDevice:', this.hasInitialDevice);

        // 新規デバイスのコンフィグ状態を初期化
        this.deviceConfigStatus.set(deviceStr, {
            trackDetail: false,
            noteBuilder: false,
            generator: false
        });

        // 接続直後は受信のみ（即時同期は行わない）
    }

    /**
     * デバイス切断時の処理
     */
    private handleDeviceDisconnected(device: P2PMacAddress): void {
        const deviceStr = getAddressString(device);

        // アプリのMACアドレス（自分自身）は除外
        const myAddress = this.mesh.getAddress();
        if (getAddressString(device) === getAddressString(myAddress)) {
            console.log('TrackConfigManager: Skipping device disconnection from self:', deviceStr);
            return;
        }

        this.deviceConfigStatus.delete(deviceStr);
        console.log('TrackConfigManager: Device disconnected:', deviceStr);
    }

    /**
     * デバイスのコンフィグ状態を更新
     */
    private updateDeviceConfigStatus(deviceStr: string, configType: string, hasConfig: boolean): void {
        const status = this.deviceConfigStatus.get(deviceStr);
        if (status) {
            const previousStatus = {
                trackDetail: status.trackDetail,
                noteBuilder: status.noteBuilder,
                generator: status.generator
            };

            switch (configType) {
                case 'trackDetail':
                    status.trackDetail = hasConfig;
                    break;
                case 'noteBuilder':
                    status.noteBuilder = hasConfig;
                    break;
                case 'generator':
                    status.generator = hasConfig;
                    break;
            }

            // 状態が変更された場合、deviceConfigChangedイベントを発火
            if (previousStatus[configType as keyof typeof previousStatus] !== hasConfig) {
                // デバイスアドレスを逆引きしてP2PMacAddressを取得
                const deviceAddress = getAddressFromString(deviceStr);
                if (deviceAddress) {
                    this.emit('deviceConfigChanged', deviceAddress, configType, -1); // trackIndexは-1で全トラック
                }
            }
        }
    }

    /**
     * 初期化完了をチェック
     */
    private checkInitializationComplete(): void {
        const allConfigsReceived = this.initialConfigReceived.trackDetail &&
            this.initialConfigReceived.noteBuilder &&
            this.initialConfigReceived.generator;

        if (allConfigsReceived && !this.hasInitialDevice) {
            this.hasInitialDevice = true;
            console.log('TrackConfigManager: All initial configs received, initialization complete!');
            console.log('TrackConfigManager: Initial config status:', this.initialConfigReceived);
        }
    }

    /**
     * アプリコンフィグをデバイスから同期
     */
    private syncAppConfigFromDevice(configType: string, configs: any[]): void {
        console.log('TrackConfigManager: syncAppConfigFromDevice called - type:', configType, 'configs length:', configs.length);

        switch (configType) {
            case 'trackDetail':
                this.appTrackDetails = [...configs];
                console.log('TrackConfigManager: appTrackDetails updated, length:', this.appTrackDetails.length);
                break;
            case 'noteBuilder':
                this.appNoteBuilderConfigs = [...configs];
                console.log('TrackConfigManager: appNoteBuilderConfigs updated, length:', this.appNoteBuilderConfigs.length);
                break;
            case 'generator':
                this.appGeneratorConfigs = [...configs];
                console.log('TrackConfigManager: appGeneratorConfigs updated, length:', this.appGeneratorConfigs.length);
                break;
        }

        console.log('TrackConfigManager: After sync - trackDetails:', this.appTrackDetails.length, 'noteBuilder:', this.appNoteBuilderConfigs.length, 'generator:', this.appGeneratorConfigs.length);
    }

    /**
     * コンフィグ同期が必要かチェック
     */
    private checkConfigSyncRequired(device: P2PMacAddress): void {
        const deviceStr = getAddressString(device);
        const status = this.deviceConfigStatus.get(deviceStr);

        if (status) {
            const missingConfigs: string[] = [];

            if (!status.trackDetail) missingConfigs.push('trackDetail');
            if (!status.noteBuilder) missingConfigs.push('noteBuilder');
            if (!status.generator) missingConfigs.push('generator');

            if (missingConfigs.length > 0) {
                this.emit('configSyncRequired', device, missingConfigs);
            }
        }
    }

    /**
     * デバイスにコンフィグを同期
     */
    private syncConfigToDevice(device: P2PMacAddress): void {
        if (this.appTrackDetails.length === 0 && this.appNoteBuilderConfigs.length === 0 && this.appGeneratorConfigs.length === 0) return;
        console.log('Syncing configs to device:', getAddressString(device));
        // 全体同期は現状の受信仕様に合わせてまとめて送る
        const sender = (this.deviceConfigManager as any);
        if (this.appTrackDetails.length > 0 && sender.broadcastAllTrackDetails) {
            sender.broadcastAllTrackDetails(this.appTrackDetails);
        }
        if (this.appNoteBuilderConfigs.length > 0 && sender.broadcastAllNoteBuilderConfigs) {
            sender.broadcastAllNoteBuilderConfigs(this.appNoteBuilderConfigs);
        }
        if (this.appGeneratorConfigs.length > 0 && sender.broadcastAllGeneratorConfigs) {
            sender.broadcastAllGeneratorConfigs(this.appGeneratorConfigs);
        }
        this.emit('configSyncCompleted', device);
    }

    /**
     * アプリで保持したコンフィグを取得
     */
    getAppTrackDetails(): TrackDetail[] {
        console.log('TrackConfigManager: getAppTrackDetails called, returning:', this.appTrackDetails.length, 'items');
        return [...this.appTrackDetails];
    }

    getAppNoteBuilderConfigs(): NoteBuilderConfig[] {
        console.log('TrackConfigManager: getAppNoteBuilderConfigs called, returning:', this.appNoteBuilderConfigs.length, 'items');
        return [...this.appNoteBuilderConfigs];
    }

    getAppGeneratorConfigs(): GeneratorConfig[] {
        console.log('TrackConfigManager: getAppGeneratorConfigs called, returning:', this.appNoteBuilderConfigs.length, 'items');
        return [...this.appGeneratorConfigs];
    }

    /**
     * 特定トラックのアプリコンフィグを取得
     */
    getAppTrackDetail(trackIndex: number): TrackDetail | undefined {
        return this.appTrackDetails[trackIndex];
    }

    getAppNoteBuilderConfig(trackIndex: number): NoteBuilderConfig | undefined {
        return this.appNoteBuilderConfigs[trackIndex];
    }

    getAppGeneratorConfig(trackIndex: number): GeneratorConfig | undefined {
        return this.appGeneratorConfigs[trackIndex];
    }

    /**
     * アプリで保持したコンフィグを変更
     * @param configType コンフィグタイプ
     * @param trackIndex トラックインデックス
     * @param config 新しいコンフィグ
     * @param syncToDevices デバイスに即座に同期するかどうか
     */
    updateAppConfig(
        configType: 'trackDetail' | 'noteBuilder' | 'generator',
        trackIndex: number,
        config: TrackDetail | NoteBuilderConfig | GeneratorConfig,
        syncToDevices: boolean = false
    ): void {
        if (trackIndex < 0 || trackIndex >= 8) {
            throw new Error(`Invalid track index: ${trackIndex}`);
        }

        switch (configType) {
            case 'trackDetail':
                this.appTrackDetails[trackIndex] = config as TrackDetail;
                break;
            case 'noteBuilder':
                this.appNoteBuilderConfigs[trackIndex] = config as NoteBuilderConfig;
                break;
            case 'generator':
                this.appGeneratorConfigs[trackIndex] = config as GeneratorConfig;
                break;
        }

        // イベント発火
        this.emit('appConfigChanged', configType, trackIndex);

        // デバイスに即座に同期する場合
        if (syncToDevices) {
            this.syncAppConfigToAllDevices();
        }
    }

    /**
     * アプリコンフィグを全デバイスに同期
     */
    private syncAppConfigToAllDevices(): void {
        console.log('Syncing app configs to all devices');
        const sender = (this.deviceConfigManager as any);
        if (this.appTrackDetails.length > 0 && sender.broadcastAllTrackDetails) {
            sender.broadcastAllTrackDetails(this.appTrackDetails);
        }
        if (this.appNoteBuilderConfigs.length > 0 && sender.broadcastAllNoteBuilderConfigs) {
            sender.broadcastAllNoteBuilderConfigs(this.appNoteBuilderConfigs);
        }
        if (this.appGeneratorConfigs.length > 0 && sender.broadcastAllGeneratorConfigs) {
            sender.broadcastAllGeneratorConfigs(this.appGeneratorConfigs);
        }
    }

    /**
     * 特定デバイスのコンフィグ状態を取得
     */
    getDeviceConfigStatus(device: P2PMacAddress): { trackDetail: boolean; noteBuilder: boolean; generator: boolean } | undefined {
        const deviceStr = getAddressString(device);
        return this.deviceConfigStatus.get(deviceStr);
    }

    /**
     * 全デバイスのコンフィグ状態を取得
     */
    getAllDeviceConfigStatus(): Map<string, { trackDetail: boolean; noteBuilder: boolean; generator: boolean }> {
        return new Map(this.deviceConfigStatus);
    }

    /**
     * 接続済みデバイス数を取得
     */
    getConnectedDeviceCount(): number {
        return this.deviceConfigStatus.size;
    }

    /**
     * 初期化状態の確認
     */
    isReady(): boolean {
        return this.hasInitialDevice;
    }

    /**
     * 状態のクリーンアップ
     */
    cleanup(): void {
        this.removeAllListeners();
        this.deviceConfigStatus.clear();
        this.hasInitialDevice = false;
        this.initialConfigReceived = {
            trackDetail: false,
            noteBuilder: false,
            generator: false
        };
    }
}

// シングルトンインスタンスの即座生成を停止
// export const trackConfigManager = new TrackConfigManager();
