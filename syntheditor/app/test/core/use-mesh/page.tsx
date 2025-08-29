'use client';

import React, { useEffect, useMemo, useState } from 'react';
import useMesh from '@/hooks/useMesh';
import { mesh } from '@/lib/synthevery-core/connection/mesh';
import { getAddressFromString } from '@/lib/synthevery-core/connection/util';

const MultiConnectExample: React.FC = () => {
    const { connectedDevices, connectedPeers, connectDevice, disconnectDevice } = useMesh();

    const sendData = async (peer: string) => {
        const data = new Uint8Array([1, 2, 3, 4, 5]);
        for (let i = 0; i < 30; i++) {
            await mesh.sendPacket(
                40, getAddressFromString(peer), new Uint8Array(200)
            );
        }
    }

    return (
        <div className="light min-h-screen bg-background text-foreground p-6">
            <button
                onClick={() => connectDevice()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
                Connect
            </button>
            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-3">Connected Peers (Directly Connected)</h2>
                <ul className="space-y-2">
                    {connectedPeers.map(device => (
                        <li key={device} className="p-3 bg-card text-card-foreground rounded-md border">
                            {device}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-3">Connected Devices (Directly + Indirectly Connected)</h2>
                <ul className="space-y-2">
                    {connectedDevices.map(device => (
                        <li key={device} className="p-3 bg-card text-card-foreground rounded-md border flex items-center justify-between">
                            <span>{device}</span>
                            <button
                                onClick={() => sendData(device)}
                                className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80 transition-colors"
                            >
                                Send Data
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default MultiConnectExample;