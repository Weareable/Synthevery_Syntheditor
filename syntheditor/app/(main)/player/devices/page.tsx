'use client'
import React from 'react';
import { DevicePanel } from '@/components/device';

/**
 * デバイス管理ページ
 * 
 * 接続されているSyntheveryデバイスの状態と装着位置を表示します。
 */
export default function DevicesPage() {
    return (
        <div className="w-full h-full">
            <DevicePanel />
        </div>
    );
}
