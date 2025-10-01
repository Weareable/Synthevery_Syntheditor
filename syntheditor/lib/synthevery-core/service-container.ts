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
import { InstrumentRepository } from './instruments/instrument-repository';
import { InstrumentService } from './instruments/instrument-service';
import { PlayerSyncStates } from './player/states';
import { DeviceTypeSynchronizer } from './devicetype/devicetype';
import { SRArqSessionsController } from './connection/srarq/session';
import { CRDTSyncManager } from './crdt/crdt-sync';
import { CrdtProjectionStore } from './crdt/projection-store';

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
    instrumentRepository: InstrumentRepository;
    instrumentService: InstrumentService;
    playerSyncStates: PlayerSyncStates;
    deviceTypeSynchronizer: DeviceTypeSynchronizer;
    srarqSessionsController: SRArqSessionsController;
    crdtSyncManager: CRDTSyncManager;
    crdtProjectionStore: CrdtProjectionStore;
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

        // 5. CRDT同期マネージャ（mesh, commandDispatcher に依存）
        // CRDT 投影ストア（トラック数は TrackState の既定長に合わせる）
        const defaultTrackCount = 8;
        const crdtProjectionStore = new CrdtProjectionStore(defaultTrackCount);

        // 6. 第4レベルの依存（mesh, commandDispatcher, playerSyncStates, crdtProjectionStoreに依存）
        const deviceController = new DeviceController(mesh, commandDispatcher, playerSyncStates, crdtProjectionStore);

        // 7. 第5レベルの依存（mesh, dataTransferController, deviceControllerに依存）
        const deviceConfigManager = new DeviceConfigManager(mesh, dataTransferController, deviceController);

        // 8. 第6レベルの依存（mesh, deviceConfigManagerに依存）
        const trackConfigManager = new TrackConfigManager(mesh, deviceConfigManager);
        const instrumentRepository = new InstrumentRepository();
        const instrumentService = new InstrumentService(instrumentRepository, trackConfigManager, dataTransferController, mesh, deviceConfigManager);
        const crdtSyncManager = new CRDTSyncManager(mesh, commandDispatcher, {
            onAdd: (_peer, track, note) => { crdtProjectionStore.onAdd(track, note); },
            onRemove: (_peer, track, id) => { crdtProjectionStore.onRemove(track, id); },
            getAuditPayload: () => {
                // XOR ハッシュは NoteOrSet から集約
                let add = 0 >>> 0;
                let rem = 0 >>> 0;
                for (const s of crdtProjectionStore.getSets()) {
                    add = (add ^ (s.addHashXor() >>> 0)) >>> 0;
                    rem = (rem ^ (s.removeHashXor() >>> 0)) >>> 0;
                }
                const out = new Uint8Array(8);
                out[0] = add & 0xff; out[1] = (add >>> 8) & 0xff; out[2] = (add >>> 16) & 0xff; out[3] = (add >>> 24) & 0xff;
                out[4] = rem & 0xff; out[5] = (rem >>> 8) & 0xff; out[6] = (rem >>> 16) & 0xff; out[7] = (rem >>> 24) & 0xff;
                return out;
            },
            onReceiveAudit: (_peer, _data) => { /* optional logging */ },
            getFullState: () => crdtProjectionStore.getFullStateSingle(),
            onReceiveFull: (_peer, notes) => { crdtProjectionStore.onReceiveFullSingle(notes); },
            getFullStateMulti: () => crdtProjectionStore.getFullStateMulti(),
            onReceiveFullMulti: (_peer: any, tracks: { track: number; adds: any[]; removes: any[] }[]) => { crdtProjectionStore.onReceiveFullMulti(tracks as any); },
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
                    // 現在のフル投影は投影ストアから取得
                    return crdtProjectionStore.getFullStateSingle();
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
            instrumentRepository,
            instrumentService,
            playerSyncStates,
            deviceTypeSynchronizer,
            srarqSessionsController,
            crdtSyncManager,
            crdtProjectionStore,
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
