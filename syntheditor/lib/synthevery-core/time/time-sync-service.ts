import { EventEmitter } from 'eventemitter3'
import { mesh } from '../connection/mesh'
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
    readonly base = new PerfTimeBase()
    readonly syncTime = new SyncTime(this.base)
    readonly synchronizer = new TimeSynchronizer(this.syncTime)
    readonly node = new TimeSyncNode(this.synchronizer, this.base, 8)

    readonly eventEmitter = new EventEmitter<TimeSyncServiceEvents>()

    private _isSyncing = false
    private _lastTarget: P2PMacAddress | null = null
    private _lastOffsetUs: number | null = null
    private _lastBaseOffsetUs: number | null = null
    private _lastSamples: ReturnType<typeof this.node.getSamples> = []

    constructor() {
        // 自動開始: デバイス順序が更新されたら先頭と同期
        mesh.eventEmitter.on('deviceOrderChanged', () => {
            this.tryStartOldest()
        })
    }

    private tryStartOldest(): void {
        const order = mesh.getDeviceOrder()
        if (order.length === 0) return
        if (this._isSyncing) return
        const oldest = order[0]
        this.start(oldest)
    }

    start(target: P2PMacAddress): boolean {
        if (!mesh.isAvailable(target)) {
            return false
        }
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
}

export const timeSyncService = new TimeSyncService()


