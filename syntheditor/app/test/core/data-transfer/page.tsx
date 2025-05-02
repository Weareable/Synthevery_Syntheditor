'use client';

import React, { useEffect, useState } from 'react';
import { mesh } from '@/lib/synthevery-core/connection/mesh';
import { getAddressString } from '@/lib/synthevery-core/connection/util';
import { mock } from '@/lib/synthevery-core/connection/srarq/mock';

mock; // モックを呼び出す

const DataTransferExample: React.FC = () => {
    const [peerDevices, setPeerDevices] = useState<string[]>([]);

    const connectDevice = async () => {
        await mesh.connectDevice();
    }

    const updatePeerDevices = () => {
        console.log('updatePeerDevices');
        setPeerDevices(mesh.getConnectedPeers().map(device => getAddressString(device)));
    }

    useEffect(() => {
        mesh.eventEmitter.on('peerConnected', updatePeerDevices);
        mesh.eventEmitter.on('peerDisconnected', updatePeerDevices);

        return () => {
            mesh.eventEmitter.removeListener('peerConnected', updatePeerDevices);
            mesh.eventEmitter.removeListener('peerDisconnected', updatePeerDevices);
        }
    }, []);

    return (
        <div>
            <div>
                <button onClick={() => connectDevice()}>Connect</button>
            </div>

            <div>
                {peerDevices.map(device => <div key={device}>{device}</div>)}
            </div>
        </div>
    );
};

export default DataTransferExample;