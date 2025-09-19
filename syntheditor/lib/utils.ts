import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getAddressString } from "@/lib/synthevery-core/connection/util"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDeviceAlphabetId(meshDeviceOrder: any[], address: string): string {
  const index = meshDeviceOrder.findIndex(device =>
    getAddressString(device) === address
  )
  return index >= 0 ? String.fromCharCode(65 + index) : '?'
}
