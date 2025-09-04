import { TimeBase, wrapU32 } from './utils'

export class PerfTimeBase implements TimeBase {
    micros(): number {
        return wrapU32(Math.floor(performance.now() * 1000))
    }
    millis(): number {
        return Math.floor(this.micros() / 1000)
    }
    seconds(): number {
        return this.micros() / 1_000_000
    }
}

export class SyncTime implements TimeBase {
    private readonly base: TimeBase
    private offsetUs: number

    constructor(base: TimeBase, offsetUs: number = 0) {
        this.base = base
        this.offsetUs = offsetUs >>> 0
    }

    setOffset(us: number): void {
        this.offsetUs = us >>> 0
    }

    getOffset(): number {
        return this.offsetUs >>> 0
    }

    micros(): number {
        return wrapU32(this.base.micros() + (this.offsetUs >>> 0))
    }

    millis(): number {
        return Math.floor(this.micros() / 1000)
    }

    seconds(): number {
        return this.micros() / 1_000_000
    }
}


