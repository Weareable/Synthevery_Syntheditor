// 基本ユーティリティ（uint32 ラップと LE 読み書き）

export function readU32LE(view: DataView, offsetBytes: number): number {
    return view.getUint32(offsetBytes, true)
}

export function writeU32LE(view: DataView, offsetBytes: number, value: number): void {
    view.setUint32(offsetBytes, value >>> 0, true)
}

export function wrapU32(x: number): number {
    return x >>> 0
}

// uint32 差分を符号付き32bitに正規化して返す（オーバーフロー対応）
export function diffU32(a: number, b: number): number {
    return (((a >>> 0) - (b >>> 0)) | 0)
}

export interface TimeBase {
    micros(): number
    millis(): number
    seconds(): number
}

export function bytesToHex(buf: Uint8Array): string {
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join(' ')
}

