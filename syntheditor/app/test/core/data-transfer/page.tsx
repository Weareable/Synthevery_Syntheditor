'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { mesh } from '@/lib/synthevery-core/connection/mesh';
import { getAddressFromString, getAddressString } from '@/lib/synthevery-core/connection/util';

import { dataTransferController, MockSenderDataStore } from '@/lib/synthevery-core/data-transfer/data-transfer-controller';
import { sendGeneratorConfig, sendNoteBuilderConfig, NoteBuilderConfigReceiverPort, GeneratorConfigReceiverPort } from '@/lib/synthevery-core/player/config';
import { playerController } from '@/lib/synthevery-core/player/controller';

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
        // Receiver portsを登録
        const noteBuilderConfigReceiverPort = new NoteBuilderConfigReceiverPort();
        const generatorConfigReceiverPort = new GeneratorConfigReceiverPort();

        // 受信イベントのリスナーを設定
        noteBuilderConfigReceiverPort.eventEmitter.on('received', (config) => {
            console.log('Received NoteBuilderConfig:', config);
        });

        generatorConfigReceiverPort.eventEmitter.on('received', (config) => {
            console.log('Received GeneratorConfig:', config);
        });

        // DataTransferControllerにreceiver portsを登録
        dataTransferController.registerReceiverPort(noteBuilderConfigReceiverPort);
        dataTransferController.registerReceiverPort(generatorConfigReceiverPort);

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

    const retrieveConfig = useCallback((peer: string) => {
        const peerAddress = getAddressFromString(peer);
        const config = playerController.requestNoteBuilderConfig(peerAddress);
        console.log(config);
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
                    <button onClick={() => retrieveConfig(device)}>Retrieve</button>
                </div>)}
            </div>
        </div>
    );
};

export default DataTransferExample;