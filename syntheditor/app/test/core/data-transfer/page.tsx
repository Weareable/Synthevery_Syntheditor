'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { mesh } from '@/lib/synthevery-core/connection/mesh';
import { getAddressFromString, getAddressString } from '@/lib/synthevery-core/connection/util';

import { sendGeneratorConfig, sendNoteBuilderConfig } from '@/lib/synthevery-core/device/config';
import { deviceConfigManager } from '@/lib/synthevery-core/device/device-config-manager';



const DataTransferExample: React.FC = () => {
    const [peerDevices, setPeerDevices] = useState<string[]>([]);
    const [deviceConfigs, setDeviceConfigs] = useState<Map<string, any[]>>(new Map());
    const [generatorConfigs, setGeneratorConfigs] = useState<Map<string, any[]>>(new Map());

    const connectDevice = async () => {
        await mesh.connectDevice();
    }

    const updatePeerDevices = () => {
        console.log('updatePeerDevices');
        setPeerDevices(mesh.getConnectedPeers().map(device => getAddressString(device)));
    }

    useEffect(() => {
        // deviceConfigManagerのイベントリスナーを設定
        deviceConfigManager.eventEmitter.on('noteBuilderConfigReceived', (device, config) => {
            console.log('DeviceConfigManager: Received config from:', getAddressString(device), 'config:', config);
            setDeviceConfigs(new Map(deviceConfigManager.getAllConfigs()));
        });

        deviceConfigManager.eventEmitter.on('generatorConfigReceived', (device, config) => {
            console.log('DeviceConfigManager: Received generator config from:', getAddressString(device), 'config:', config);
            setGeneratorConfigs(new Map(deviceConfigManager.getAllGeneratorConfigs()));
        });

        deviceConfigManager.eventEmitter.on('deviceConnected', (device) => {
            console.log('DeviceConfigManager: Device connected:', getAddressString(device));
        });

        deviceConfigManager.eventEmitter.on('deviceDisconnected', (device) => {
            console.log('DeviceConfigManager: Device disconnected:', getAddressString(device));
        });

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
        const config = deviceConfigManager.getConfig(peerAddress);
        console.log('Retrieved config for', peer, ':', config);
    }, []);

    const retrieveGeneratorConfig = useCallback((peer: string) => {
        const peerAddress = getAddressFromString(peer);
        const config = deviceConfigManager.getGeneratorConfig(peerAddress);
        console.log('Retrieved generator config for', peer, ':', config);
    }, []);

    return (
        <div>
            <div>
                <button onClick={() => connectDevice()}>Connect</button>
            </div>

            <div>
                <h3>Connected Devices:</h3>
                {peerDevices.map(device => <div key={device} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
                    <strong>{device}</strong>
                    <div style={{ margin: '10px 0' }}>
                        <button onClick={() => sendConfig(device)} style={{ marginRight: '10px' }}>Send Config</button>
                        <button onClick={() => retrieveConfig(device)} style={{ marginRight: '10px' }}>Get NoteBuilder Config</button>
                        <button onClick={() => retrieveGeneratorConfig(device)}>Get Generator Config</button>
                    </div>
                    {deviceConfigs.has(device) && (
                        <div style={{ marginLeft: '20px', fontSize: '0.9em', marginBottom: '10px' }}>
                            <strong>NoteBuilder Config:</strong> {JSON.stringify(deviceConfigs.get(device))}
                        </div>
                    )}
                    {generatorConfigs.has(device) && (
                        <div style={{ marginLeft: '20px', fontSize: '0.9em' }}>
                            <strong>Generator Config:</strong> {JSON.stringify(generatorConfigs.get(device))}
                        </div>
                    )}
                </div>)}
            </div>
        </div>
    );
};

export default DataTransferExample;