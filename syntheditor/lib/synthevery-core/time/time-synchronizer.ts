import { SyncTime } from './sync-time'
import { diffU32 } from './utils'

export interface TimeSyncSample {
    t0: number
    t1: number
    t2: number
    t3: number
}

export function iqrFilter(values: number[]): number[] {
    if (values.length < 4) return values.slice()
    const sorted = values.slice().sort((a, b) => a - b)
    const n = sorted.length
    const q1 = sorted[Math.floor(n / 4)]
    const q3 = sorted[Math.floor((n * 3) / 4)]
    const iqr = q3 - q1
    const lo = q1 - 1.5 * iqr
    const hi = q3 + 1.5 * iqr
    return sorted.filter(v => v >= lo && v <= hi)
}

export class TimeSynchronizer {
    private readonly syncTime: SyncTime

    constructor(syncTime: SyncTime) {
        this.syncTime = syncTime
    }

    getSyncTime(): SyncTime {
        return this.syncTime
    }

    updateOffset(samples: TimeSyncSample[], baseOffsetUs: number): void {
        if (samples.length === 0) return

        const offsets: number[] = []
        for (const s of samples) {
            const d1 = diffU32(s.t1, s.t0)
            const d2 = diffU32(s.t2, s.t3)
            const offset = Math.trunc((d1 + d2) / 2)
            offsets.push(offset)
        }

        let filtered = offsets
        if (samples.length >= 8) {
            filtered = iqrFilter(offsets)
        }
        if (filtered.length === 0) {
            filtered = offsets
        }

        const avg = Math.floor(filtered.reduce((a, b) => a + b, 0) / filtered.length)
        const finalOffset = (avg >>> 0) + (baseOffsetUs >>> 0)
        this.syncTime.setOffset(finalOffset >>> 0)
    }
}


