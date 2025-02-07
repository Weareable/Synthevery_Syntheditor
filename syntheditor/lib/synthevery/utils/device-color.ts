// lib/device-color-utils.ts

import { P2PMacAddress } from '@/types/mesh';
import { getAddressString } from '@/lib/synthevery/connection/mesh-node';

const deviceColors = [
    '#F44336', // Red
    '#E91E63', // Pink
    '#9C27B0', // Purple
    '#673AB7', // Deep Purple
    '#3F51B5', // Indigo
    '#2196F3', // Blue
    '#03A9F4', // Light Blue
    '#00BCD4', // Cyan
    '#009688', // Teal
    '#4CAF50', // Green
    '#8BC34A', // Light Green
    '#CDDC39', // Lime
    '#FFEB3B', // Yellow
    '#FFC107', // Amber
    '#FF9800', // Orange
    '#FF5722', // Deep Orange
    '#795548', // Brown
    '#9E9E9E', // Grey
    '#607D8B', // Blue Grey
];

export const getDeviceColor = (device: P2PMacAddress): string => {
    const macAddressString = getAddressString(device.address);
    // MACアドレスのハッシュ値を計算 (簡易的な例)
    let hash = 0;
    for (let i = 0; i < macAddressString.length; i++) {
        hash = macAddressString.charCodeAt(i) + ((hash << 5) - hash);
    }
    // ハッシュ値を色パレットのインデックスに変換
    const index = Math.abs(hash) % deviceColors.length;
    return deviceColors[index];
};

export const getDeviceColorByPosition = (index: number, maxDevices: number = 8): string => {
    // Hueをリストの位置に基づいて変化させる (0-360度の範囲で均等に分布させる例)
    const hue = (index * (360 / maxDevices)) % 360; // 8 はトラック数 (または想定される最大デバイス数)

    const saturation = 70; // 彩度 (調整可能)
    const lightness = 50;  // 明度 (調整可能)
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};