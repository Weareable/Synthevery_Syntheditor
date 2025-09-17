import { Mesh } from '../connection/mesh'
import { MESH_PACKET_TYPE_TIME_SYNC } from '../connection/constants'
import { P2PMacAddress } from '../types/mesh'
import { TimeSynchronizer, TimeSyncSample } from './time-synchronizer'
import { TimeBase, writeU32LE, readU32LE, bytesToHex } from './utils'

type OnComplete = (target: P2PMacAddress, finalOffsetUs: number) => void

export class TimeSyncNode {
    private readonly mesh: Mesh;
    private readonly synchronizer: TimeSynchronizer
    private readonly base: TimeBase
    private readonly numCommands: number
    private currentCommandIndex: number = 0
    private currentOffset: number = 0
    private lastBaseOffsetUs: number = 0
    private completedSamples: TimeSyncSample[] = []
    private samples: TimeSyncSample[] = []
    private syncingTarget: P2PMacAddress | null = null
    private onComplete: OnComplete | null = null
    private timerId: ReturnType<typeof setTimeout> | null = null
    private retryCount: number = 0
    private static readonly TIMEOUT_MS = 1000
    private static readonly MAX_RETRY = 3

    constructor(mesh: Mesh, synchronizer: TimeSynchronizer, base: TimeBase, numCommands: number = 8) {
        this.mesh = mesh;
        this.synchronizer = synchronizer
        this.base = base
        this.numCommands = numCommands

        this.mesh.setCallback(MESH_PACKET_TYPE_TIME_SYNC, (packet) => {
            this.receiveData(packet.source, packet.data)
        })
    }

    startSynchronize(target: P2PMacAddress, onComplete?: OnComplete): void {
        this.syncingTarget = target
        this.currentCommandIndex = 0
        this.samples = []
        this.onComplete = onComplete || null
        this.retryCount = 0
        this.sendClientData()
    }

    private sendClientData(): void {
        if (!this.syncingTarget) return
        const index = (this.currentCommandIndex & 0xff) >>> 0
        const buf = new Uint8Array([index])
        const t0 = this.base.micros()
        // 送信
        console.debug('[TimeSync] TX len=', buf.length, 'data=', bytesToHex(buf))
        this.mesh.sendPacket(MESH_PACKET_TYPE_TIME_SYNC, this.syncingTarget, buf)
        // 記録
        this.ensureSampleSlot()
        this.samples[this.currentCommandIndex].t0 = t0
        // タイムアウト監視
        this.armTimer()
    }

    private ensureSampleSlot(): void {
        if (this.samples.length <= this.currentCommandIndex) {
            this.samples.push({ t0: 0, t1: 0, t2: 0, t3: 0 })
        }
    }

    receiveData(address: P2PMacAddress, data: Uint8Array): void {
        if (!this.syncingTarget) return
        const receivedTime = this.base.micros()

        // サーバ: ClientData を受け取った場合（Webがサーバ化するケース）
        if (data.length === 1) {
            console.debug('[TimeSync] RX(ClientData) len=1 data=', bytesToHex(data))
            const index = data[0]
            const serverData = new Uint8Array(13)
            const view = new DataView(serverData.buffer)
            writeU32LE(view, 0, receivedTime)
            writeU32LE(view, 4, this.base.micros())
            serverData[8] = index
            // Web側がサーバ応答を返す場合は、現在の同期オフセットを返す
            const currentOffsetUs = this.synchronizer.getSyncTime().getOffset() >>> 0
            writeU32LE(view, 9, currentOffsetUs)
            this.mesh.sendPacket(MESH_PACKET_TYPE_TIME_SYNC, address, serverData)
            return
        }

        // クライアント: ServerData を受け取った場合（13バイト or 構造体パディング16バイト）
        if (data.length === 13 || data.length === 16) {
            console.debug('[TimeSync] RX(ServerData) len=', data.length, ' data=', bytesToHex(data))
            this.disarmTimer()
            const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
            const t1 = readU32LE(view, 0)
            const t2 = readU32LE(view, 4)
            const index = data[8]
            // 13バイト: current_offset はオフセット9 / 16バイト: パディング(3)でオフセット12
            const baseOffset = data.length === 13 ? readU32LE(view, 9) : readU32LE(view, 12)
            this.lastBaseOffsetUs = baseOffset >>> 0

            if (index !== (this.currentCommandIndex & 0xff)) {
                // index 不整合: リセット
                this.reset()
                // 再送開始
                this.sendClientData()
                return
            }

            this.ensureSampleSlot()
            this.samples[this.currentCommandIndex].t1 = t1
            this.samples[this.currentCommandIndex].t2 = t2
            this.samples[this.currentCommandIndex].t3 = receivedTime

            this.currentCommandIndex++
            if (this.currentCommandIndex >= this.numCommands) {
                this.synchronizer.updateOffset(this.samples, baseOffset)
                const finalOffset = this.synchronizer.getSyncTime().getOffset() >>> 0
                const doneTarget = this.syncingTarget
                // 完了サンプルを保持（resetで消える前にコピー）
                this.completedSamples = this.samples.slice()
                this.reset()
                if (this.onComplete && doneTarget) this.onComplete(doneTarget, finalOffset)
                return
            }

            this.sendClientData()
        }
        if (data.length !== 1 && data.length !== 13) {
            console.debug('[TimeSync] RX unexpected length=', data.length)
        }
    }

    private reset(): void {
        this.disarmTimer()
        this.currentCommandIndex = 0
        this.samples = []
        this.retryCount = 0
    }

    private armTimer(): void {
        this.disarmTimer()
        this.timerId = setTimeout(() => {
            this.onTimeout()
        }, TimeSyncNode.TIMEOUT_MS)
    }

    private disarmTimer(): void {
        if (this.timerId) {
            clearTimeout(this.timerId)
            this.timerId = null
        }
    }

    private onTimeout(): void {
        if (!this.syncingTarget) return
        if (this.retryCount < TimeSyncNode.MAX_RETRY) {
            this.retryCount++
            this.sendClientData()
            return
        }
        const failTarget = this.syncingTarget
        this.cancel()
        if (this.onComplete && failTarget) this.onComplete(failTarget, 0)
    }

    private cancel(): void {
        this.syncingTarget = null
        this.reset()
    }

    // Debug/inspectors
    getSamples(): TimeSyncSample[] { return this.samples.slice() }
    getCompletedSamples(): TimeSyncSample[] { return this.completedSamples.slice() }
    getLastBaseOffsetUs(): number { return this.lastBaseOffsetUs }
    getRetryCount(): number { return this.retryCount }
    getNumCommands(): number { return this.numCommands }
}


