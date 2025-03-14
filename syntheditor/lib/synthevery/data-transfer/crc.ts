export function calculateCRC32(data: Uint8Array): number {
    if (!data || data.length === 0) {
        return 0;
    }

    let crc = 0xFFFFFFFF; // 初期値

    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            if (crc & 1) {
                crc = (crc >>> 1) ^ 0xEDB88320; // 多項式 (Polynomial)
            } else {
                crc >>>= 1; // 論理右シフト (0埋め)
            }
        }
    }

    return ~crc >>> 0; // ビット反転し、符号なし32ビット整数として返す
}