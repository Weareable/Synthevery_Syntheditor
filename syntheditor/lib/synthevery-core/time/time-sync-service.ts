import { EventEmitter } from 'eventemitter3'
import { Mesh } from '../connection/mesh'
import { getAddressString } from '../connection/util'
import { P2PMacAddress } from '../types/mesh'
import { PerfTimeBase, SyncTime } from './sync-time'
import { TimeSynchronizer } from './time-synchronizer'
import { TimeSyncNode } from './time-sync-node'

interface TimeSyncServiceEvents {
    started: (target: P2PMacAddress) => void
    completed: (target: P2PMacAddress, offsetUs: number) => void
    updated: () => void
}

export class TimeSyncService {
    private mesh: Mesh;
    readonly base = new PerfTimeBase()
    readonly syncTime = new SyncTime(this.base)
    readonly synchronizer = new TimeSynchronizer(this.syncTime)
    readonly node: TimeSyncNode;

    readonly eventEmitter = new EventEmitter<TimeSyncServiceEvents>()

    private _isSyncing = false
    private _lastTarget: P2PMacAddress | null = null
    private _lastOffsetUs: number | null = null
    private _lastBaseOffsetUs: number | null = null
    private _lastSamples: ReturnType<typeof this.node.getSamples> = []
    private _syncTimer: NodeJS.Timeout | null = null
    private _isAutoSyncEnabled = true

    constructor(mesh: Mesh) {
        this.mesh = mesh;
        this.node = new TimeSyncNode(mesh, this.synchronizer, this.base, 12, 9);

        // 自動開始: デバイス順序が更新されたら先頭と同期
        this.mesh.eventEmitter.on('deviceOrderChanged', () => {
            this.tryStartOldest()
        })

        // 5秒ごとの自動同期タイマーを開始
        this.startAutoSync()
    }

    private tryStartOldest(): void {
        const order = this.mesh.getDeviceOrder()
        if (order.length === 0) {
            console.log('[TimeSync] No devices available for synchronization')
            return
        }
        if (this._isSyncing) {
            console.log('[TimeSync] Synchronization already in progress, skipping')
            return
        }
        const oldest = order[0]
        console.log('[TimeSync] Attempting to sync with oldest device:', getAddressString(oldest))
        this.start(oldest)
    }

    private startAutoSync(): void {
        this.stopAutoSync() // 既存のタイマーをクリア
        if (!this._isAutoSyncEnabled) return

        console.log('[TimeSync] Starting auto-sync timer (5 second interval)')
        this._syncTimer = setInterval(() => {
            console.log('[TimeSync] Auto-sync triggered')
            this.tryStartOldest()
        }, 5000) // 5秒ごとに実行
    }

    private stopAutoSync(): void {
        if (this._syncTimer) {
            console.log('[TimeSync] Stopping auto-sync timer')
            clearInterval(this._syncTimer)
            this._syncTimer = null
        }
    }

    enableAutoSync(): void {
        console.log('[TimeSync] Enabling auto-sync')
        this._isAutoSyncEnabled = true
        this.startAutoSync()
    }

    disableAutoSync(): void {
        console.log('[TimeSync] Disabling auto-sync')
        this._isAutoSyncEnabled = false
        this.stopAutoSync()
    }

    start(target: P2PMacAddress): boolean {
        if (!this.mesh.isAvailable(target)) {
            console.log('[TimeSync] Failed to start sync: target not available', getAddressString(target))
            return false
        }

        console.log('[TimeSync] Starting synchronization with', getAddressString(target))
        this._isSyncing = true
        this._lastTarget = target
        this._lastOffsetUs = null
        this._lastBaseOffsetUs = null
        this._lastSamples = []
        this.eventEmitter.emit('started', target)
        this.eventEmitter.emit('updated')

        this.node.startSynchronize(target, (t, finalOffsetUs) => {
            this._isSyncing = false
            this._lastOffsetUs = finalOffsetUs >>> 0
            this._lastBaseOffsetUs = this.node.getLastBaseOffsetUs()
            this._lastSamples = this.node.getCompletedSamples()

            console.log('[TimeSync] Synchronization completed:', {
                target: getAddressString(t),
                offsetUs: this._lastOffsetUs,
                baseOffsetUs: this._lastBaseOffsetUs,
                samplesCount: this._lastSamples.length
            })

            this.eventEmitter.emit('completed', t, this._lastOffsetUs)
            this.eventEmitter.emit('updated')
        })
        return true
    }

    get isSyncing(): boolean { return this._isSyncing }
    get lastTarget(): P2PMacAddress | null { return this._lastTarget }
    get lastTargetString(): string | null { return this._lastTarget ? getAddressString(this._lastTarget) : null }
    get lastOffsetUs(): number | null { return this._lastOffsetUs }
    get lastBaseOffsetUs(): number | null { return this._lastBaseOffsetUs }
    get lastSamples(): ReturnType<typeof this.node.getSamples> { return this._lastSamples }
    get isAutoSyncEnabled(): boolean { return this._isAutoSyncEnabled }

    destroy(): void {
        this.stopAutoSync()
        this.eventEmitter.removeAllListeners()
    }
}

// シングルトンインスタンスの即座生成を停止
// export const timeSyncService = new TimeSyncService()


