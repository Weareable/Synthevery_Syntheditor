/**
 * SyntheveryServiceContainer
 * 
 * synthevery-coreの各サービスを依存関係を考慮して初期化し、
 * クライアントサイドでのみ実行されるServiceContainerパターンを実装
 */

// 各サービスのクラスをインポート（インスタンスではなく）
import { Mesh } from './connection/mesh';
import { CommandDispatcher } from './command/dispatcher';
import { AppStateSyncConnector } from './appstate/sync';
import { DeviceController } from './device/controller';
import { DataTransferController } from './data-transfer/data-transfer-controller';
import { TimeSyncService } from './time/time-sync-service';
import { DeviceConfigManager } from './device/device-config-manager';
import { TrackConfigManager } from './tracks/track-config-manager';
import { PlayerSyncStates } from './player/states';
import { DeviceTypeSynchronizer } from './devicetype/devicetype';
import { SRArqSessionsController } from './connection/srarq/session';
import { CRDTSyncManager } from './crdt/crdt-sync';

/**
 * 全てのサービスインスタンスを保持するコンテナ
 */
export interface SyntheveryServices {
    mesh: Mesh;
    commandDispatcher: CommandDispatcher;
    appStateSyncConnector: AppStateSyncConnector;
    deviceController: DeviceController;
    dataTransferController: DataTransferController;
    timeSyncService: TimeSyncService;
    deviceConfigManager: DeviceConfigManager;
    trackConfigManager: TrackConfigManager;
    playerSyncStates: PlayerSyncStates;
    deviceTypeSynchronizer: DeviceTypeSynchronizer;
    srarqSessionsController: SRArqSessionsController;
    crdtSyncManager: CRDTSyncManager;
}

/**
 * SyntheveryServiceContainer
 * 
 * 依存関係を考慮した順序でサービスを初期化し、
 * クライアントサイドでのみ実行される
 */
export class SyntheveryServiceContainer {
    private services: SyntheveryServices | null = null;
    private isInitialized = false;

    /**
     * サービスを初期化する
     * 依存関係の順序に従って初期化を実行
     */
    public initialize(): SyntheveryServices {
        if (this.isInitialized && this.services) {
            return this.services;
        }

        console.log('Initializing Synthevery services on the client...');

        // 1. 基本サービス（依存なし）
        const mesh = new Mesh();

        // 2. 第1レベルの依存（meshに依存）
        const commandDispatcher = new CommandDispatcher(mesh);
        const deviceTypeSynchronizer = new DeviceTypeSynchronizer(mesh);
        const srarqSessionsController = new SRArqSessionsController(mesh);

        // 3. 第2レベルの依存（mesh, commandDispatcherに依存）
        const appStateSyncConnector = new AppStateSyncConnector(mesh, commandDispatcher);
        const dataTransferController = new DataTransferController(mesh, commandDispatcher, srarqSessionsController);
        const timeSyncService = new TimeSyncService(mesh);

        // 4. 第3レベルの依存（appStateSyncConnectorに依存）
        const playerSyncStates = new PlayerSyncStates(appStateSyncConnector);

        // 5. 第4レベルの依存（mesh, commandDispatcher, playerSyncStatesに依存）
        const deviceController = new DeviceController(mesh, commandDispatcher, playerSyncStates);

        // 6. 第5レベルの依存（mesh, dataTransferController, deviceControllerに依存）
        const deviceConfigManager = new DeviceConfigManager(mesh, dataTransferController, deviceController);

        // 7. 第6レベルの依存（mesh, deviceConfigManagerに依存）
        const trackConfigManager = new TrackConfigManager(mesh, deviceConfigManager);

        // 8. CRDT同期マネージャ（mesh, commandDispatcher に依存）
        const crdtSyncManager = new CRDTSyncManager(mesh, commandDispatcher, {
            onAdd: (_peer, _track, _note) => { /* 上位で接続（UI層） */ },
            onRemove: (_peer, _track, _id) => { /* 上位で接続（UI層） */ },
            getAuditPayload: () => new Uint8Array(),
            onReceiveAudit: (_peer, _data) => { /* ログ等 */ },
            getFullState: () => [],
            onReceiveFull: (_peer, _notes) => { /* 上位で接続（UI層） */ },
        });

        // 9. DataTransfer: CRDT full state receiver
        try {
            const { CRDTFullStateReceiverPort } = require('./data-transfer/crdt-full');
            dataTransferController.registerReceiverPort(new CRDTFullStateReceiverPort(
                (peer: any, notes: any[]) => {
                    crdtSyncManager.setHandlers({ onReceiveFull: (_p, _n) => { } });
                    (crdtSyncManager as any).handlerOnReceiveFull(peer, notes);
                },
                () => {
                    // 現在のフル投影は CRDT 同期マネージャのハンドラに依存
                    // Web側では NoteOrSet の投影を保持する上位から注入する想定
                    // ここでは空配列を返す（UI層の setupCrdtSync で上書き）
                    return [];
                },
                dataTransferController
            ));
        } catch (e) {
            console.warn('CRDTFullStateTransfer registration failed:', e);
        }

        // 全てのサービスをまとめる
        this.services = {
            mesh,
            commandDispatcher,
            appStateSyncConnector,
            deviceController,
            dataTransferController,
            timeSyncService,
            deviceConfigManager,
            trackConfigManager,
            playerSyncStates,
            deviceTypeSynchronizer,
            srarqSessionsController,
            crdtSyncManager,
        };

        this.isInitialized = true;
        console.log('Synthevery services initialized successfully');

        return this.services;
    }

    /**
     * 初期化済みのサービスを取得
     */
    public getServices(): SyntheveryServices {
        if (!this.isInitialized || !this.services) {
            throw new Error('Services not initialized. Call initialize() first.');
        }
        return this.services;
    }

    /**
     * 初期化状態を確認
     */
    public isReady(): boolean {
        return this.isInitialized && this.services !== null;
    }

    /**
     * サービスを破棄（クリーンアップ）
     */
    public destroy(): void {
        if (this.services) {
            // 各サービスのクリーンアップメソッドがあれば呼び出す
            // 例: this.services.mesh.destroy();
            this.services = null;
            this.isInitialized = false;
            console.log('Synthevery services destroyed');
        }
    }
}

// シングルトンインスタンス（ただし、初期化はクライアントサイドでのみ実行）
export const syntheveryServiceContainer = new SyntheveryServiceContainer();
