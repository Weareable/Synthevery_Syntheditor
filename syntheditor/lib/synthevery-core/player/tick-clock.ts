import { TimeBase } from '@/lib/synthevery-core/time/utils'

export interface TickClockFollowerState {
    isRunning: boolean
    beatPerMinute: number
    originTimeUs: number
    ticksPerBeat: number
}

export class TickClockFollower {
    private readonly timeBase: TimeBase
    private state: TickClockFollowerState
    private ticksPerSecond: number
    private currentTickCached: number

    constructor(timeBase: TimeBase, bpm: number = 120, ticksPerBeat: number = 480) {
        this.timeBase = timeBase
        this.state = {
            isRunning: false,
            beatPerMinute: bpm,
            originTimeUs: 0,
            ticksPerBeat,
        }
        this.ticksPerSecond = (this.state.beatPerMinute / 60) * this.state.ticksPerBeat
        this.currentTickCached = 0
    }

    start(): void {
        if (this.state.isRunning) return
        // フォロワではリーダー配信の origin を信頼し、origin の再計算はしない
        this.state.isRunning = true
    }

    pause(): void {
        if (!this.state.isRunning) return
        // 表示用に現在値をキャッシュして停止
        this.currentTickCached = this.getTick()
        this.state.isRunning = false
    }

    setBeatPerMinute(bpm: number): void {
        const currentTick = this.getTick()
        this.state.beatPerMinute = bpm
        this.updateTicksPerSecond()
        this.recalculateOriginFromTick(currentTick)
    }

    setTicksPerBeat(tpb: number): void {
        const currentTick = this.getTick()
        this.state.ticksPerBeat = tpb
        this.updateTicksPerSecond()
        this.recalculateOriginFromTick(currentTick)
    }

    private updateTicksPerSecond(): void {
        this.ticksPerSecond = (this.state.beatPerMinute / 60) * this.state.ticksPerBeat
    }

    private recalculateOriginFromTick(currentTick: number): void {
        const micros = this.timeBase.micros()
        const origin = Math.floor(micros - (currentTick / this.ticksPerSecond) * 1_000_000)
        this.state.originTimeUs = origin >>> 0
    }

    getTick(): number {
        if (!this.state.isRunning) {
            return this.currentTickCached
        }
        const micros = this.timeBase.micros()
        const deltaUs = ((micros >>> 0) - (this.state.originTimeUs >>> 0)) >>> 0
        const value = (deltaUs / 1_000_000) * this.ticksPerSecond
        this.currentTickCached = value
        return value
    }

    setState(newState: Partial<TickClockFollowerState>): void {
        if (newState.beatPerMinute !== undefined || newState.ticksPerBeat !== undefined) {
            const currentTick = this.getTick()
            if (newState.beatPerMinute !== undefined) this.state.beatPerMinute = newState.beatPerMinute
            if (newState.ticksPerBeat !== undefined) this.state.ticksPerBeat = newState.ticksPerBeat
            this.updateTicksPerSecond()
            this.recalculateOriginFromTick(currentTick)
        }
        if (newState.originTimeUs !== undefined) {
            this.state.originTimeUs = newState.originTimeUs >>> 0
        }
        if (newState.isRunning !== undefined) {
            // 状態フラグのみ更新（start/pause は呼ばない）
            this.state.isRunning = newState.isRunning
        }
    }

    getState(): TickClockFollowerState {
        return { ...this.state }
    }
}


