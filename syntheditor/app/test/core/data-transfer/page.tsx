'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { mesh } from '@/lib/synthevery-core/connection/mesh';
import { getAddressFromString, getAddressString } from '@/lib/synthevery-core/connection/util';

import { dataTransferController, MockSenderDataStore } from '@/lib/synthevery-core/data-transfer/data-transfer-controller';
import { sendGeneratorConfig, sendNoteBuilderConfig } from '@/lib/synthevery-core/player/config';

dataTransferController;

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

    const sendConfig = useCallback((peer: string) => {
        const peerAddress = getAddressFromString(peer);

        sendNoteBuilderConfig(peerAddress, [{ type: "bongo" }, { type: "bongo" }, { type: "bongo" }]);

        sendGeneratorConfig(peerAddress, [{ class: "sf", params: { filename: "/rock_drum.sf2", preset_index: 9, is_drum: true } }, { class: "sf", params: { filename: "/rock_drum.sf2", preset_index: 9, is_drum: true } }, { class: "sf", params: { filename: "/rock_drum.sf2", preset_index: 9, is_drum: true } }]);
    }, []);

    return (
        <div>
            <div>
                <button onClick={() => connectDevice()}>Connect</button>
            </div>

            <div>
                {peerDevices.map(device => <div key={device}>
                    {device}
                    <button onClick={() => sendConfig(device)}>Send</button>
                </div>)}
            </div>
        </div>
    );
};

export default DataTransferExample;