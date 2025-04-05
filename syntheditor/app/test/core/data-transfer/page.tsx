'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { mesh } from '@/lib/synthevery-core/connection/mesh';
import { getAddressString } from '@/lib/synthevery-core/connection/util';
import { dataTransferController } from '@/lib/synthevery-core/data-transfer/data-transfer-controller';

dataTransferController.getEventEmitter();

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
            <button onClick={() => connectDevice()}>Connect</button>
        </div>
    );
};

export default DataTransferExample;