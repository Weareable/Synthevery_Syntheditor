'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { mesh } from '@/lib/synthevery-core/connection/mesh';
import { getAddressString, getAddressFromString } from '@/lib/synthevery-core/connection/util';
import { dataTransferController } from '@/lib/synthevery-core/data-transfer/data-transfer-controller';
import { MockSenderDataStore } from '@/lib/synthevery-core/data-transfer/data-transfer-controller';
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

    const sendData = async (peer: string) => {
        await dataTransferController.sendRequest(getAddressFromString(peer), new MockSenderDataStore(1800));
    }

    return (
        <div>
            <div>
                <button onClick={() => connectDevice()}>Connect</button>
            </div>

            <div>
                {peerDevices.map(device => <div key={device}>{device} <button onClick={() => sendData(device)}>Send Data</button></div>)}
            </div>
        </div>
    );
};

export default DataTransferExample;