import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * デバイスのアルファベットIDを生成
 * @param deviceOrder デバイス順序の配列
 * @param deviceAddress 対象デバイスのアドレス
 * @returns アルファベットID（A, B, C...）または '?'
 */
export function getDeviceAlphabetId(deviceOrder: string[], deviceAddress: string): string {
  const index = deviceOrder.findIndex(addr => addr === deviceAddress);

  if (index >= 0 && index < 26) {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  return '?'; // 見つからない場合または26個を超える場合
}
