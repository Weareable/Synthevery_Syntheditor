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
        <div>
            <button onClick={() => connectDevice()}>Connect</button>
            <div>
                <h2>Connected Peers (Directly Connected)</h2>
                {connectedPeers.map(device => <li key={device}>{device}</li>)}
            </div>
            <div>
                <h2>Connected Devices (Directly + Indirectly Connected)</h2>
                {connectedDevices.map(device => <li key={device}>{device} <button onClick={() => sendData(device)}>Send Data</button></li>)}
            </div>

        </div>
    );
};

export default MultiConnectExample;