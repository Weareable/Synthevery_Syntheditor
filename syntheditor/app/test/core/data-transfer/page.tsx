'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { mesh } from '@/lib/synthevery-core/connection/mesh';
import { getAddressFromString, getAddressString } from '@/lib/synthevery-core/connection/util';

import { sendGeneratorConfig, sendNoteBuilderConfig } from '@/lib/synthevery-core/device/config';
import { deviceConfigManager } from '@/lib/synthevery-core/device/device-config-manager';
import { deviceController } from '@/lib/synthevery-core/device/controller';



const DataTransferExample: React.FC = () => {
    const [peerDevices, setPeerDevices] = useState<string[]>([]);
    const [deviceConfigs, setDeviceConfigs] = useState<Map<string, any[]>>(new Map());
    const [generatorConfigs, setGeneratorConfigs] = useState<Map<string, any[]>>(new Map());

    const connectDevice = async () => {
        await mesh.connectDevice();
    }

    const updatePeerDevices = () => {
        console.log('updatePeerDevices');
        const connectedDevices = mesh.getConnectedDevices();
        const deviceStrings = connectedDevices.map(device => getAddressString(device));
        console.log('Connected devices:', deviceStrings);
        console.log('DeviceConfigManager configs:', Array.from(deviceConfigManager.getAllConfigs().keys()));
        console.log('DeviceConfigManager generator configs:', Array.from(deviceConfigManager.getAllGeneratorConfigs().keys()));
        setPeerDevices(deviceStrings);
    }

    useEffect(() => {
        // deviceConfigManagerのイベントリスナーを設定
        deviceConfigManager.eventEmitter.on('noteBuilderConfigReceived', (device, config) => {
            console.log('DeviceConfigManager: Received config from:', getAddressString(device), 'config:', config);
            console.log('All configs after update:', Array.from(deviceConfigManager.getAllConfigs().keys()));
            setDeviceConfigs(new Map(deviceConfigManager.getAllConfigs()));
        });

        deviceConfigManager.eventEmitter.on('generatorConfigReceived', (device, config) => {
            console.log('DeviceConfigManager: Received generator config from:', getAddressString(device), 'config:', config);
            console.log('All generator configs after update:', Array.from(deviceConfigManager.getAllGeneratorConfigs().keys()));
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
        console.log('Retrieving config for peer string:', peer);
        console.log('All available configs:', Array.from(deviceConfigManager.getAllConfigs().keys()));

        // 文字列のアドレスを直接使用して検索
        const config = deviceConfigManager.getAllConfigs().get(peer);
        console.log('Retrieved config for', peer, ':', config);

        if (!config) {
            console.log('No config found for peer:', peer);
            console.log('Available peers:', Array.from(deviceConfigManager.getAllConfigs().keys()));

            // 設定が存在しない場合、そのデバイスに設定をリクエスト
            console.log('Requesting config from peer:', peer);
            const peerAddress = getAddressFromString(peer);
            if (peerAddress) {
                // deviceControllerを使って設定をリクエスト
                console.log('Requesting NoteBuilderConfig from device:', peer);
                deviceController.requestNoteBuilderConfig(peerAddress);
            }
        }
    }, []);

    const retrieveGeneratorConfig = useCallback((peer: string) => {
        console.log('Retrieving generator config for peer string:', peer);
        console.log('All available generator configs:', Array.from(deviceConfigManager.getAllGeneratorConfigs().keys()));

        // 文字列のアドレスを直接使用して検索
        const config = deviceConfigManager.getAllGeneratorConfigs().get(peer);
        console.log('Retrieved generator config for', peer, ':', config);

        if (!config) {
            console.log('No generator config found for peer:', peer);
            console.log('Available peers:', Array.from(deviceConfigManager.getAllGeneratorConfigs().keys()));

            // 設定が存在しない場合、そのデバイスに設定をリクエスト
            console.log('Requesting generator config from peer:', peer);
            const peerAddress = getAddressFromString(peer);
            console.log('Requesting GeneratorConfig from device:', peer);
            deviceController.requestGeneratorConfig(peerAddress);
        }
    }, []);

    return (
        <div>
            <div>
                <button onClick={() => connectDevice()}>Connect</button>
                <button onClick={updatePeerDevices} style={{ marginLeft: '10px' }}>Refresh Device List</button>
                <button
                    onClick={() => {
                        peerDevices.forEach(peer => {
                            if (!deviceConfigs.has(peer)) {
                                const peerAddress = getAddressFromString(peer);
                                if (peerAddress) {
                                    console.log('Auto-requesting NoteBuilderConfig from:', peer);
                                    deviceController.requestNoteBuilderConfig(peerAddress);
                                }
                            }
                            if (!generatorConfigs.has(peer)) {
                                const peerAddress = getAddressFromString(peer);
                                if (peerAddress) {
                                    console.log('Auto-requesting GeneratorConfig from:', peer);
                                    deviceController.requestGeneratorConfig(peerAddress);
                                }
                            }
                        });
                    }}
                    style={{ marginLeft: '10px' }}
                >
                    Request All Missing Configs
                </button>
            </div>

            <div style={{ margin: '20px 0', padding: '10px', backgroundColor: '#f0f0f0' }}>
                <h4>Debug Info:</h4>
                <div>Connected Devices: {peerDevices.join(', ')}</div>
                <div>Device Configs: {Array.from(deviceConfigs.keys()).join(', ')}</div>
                <div>Generator Configs: {Array.from(generatorConfigs.keys()).join(', ')}</div>
                <div style={{ marginTop: '10px' }}>
                    <strong>Missing Configs:</strong>
                    {peerDevices.filter(device => !deviceConfigs.has(device)).map(device => (
                        <div key={device} style={{ color: 'red', marginLeft: '10px' }}>
                            {device} - No NoteBuilder config
                        </div>
                    ))}
                    {peerDevices.filter(device => !generatorConfigs.has(device)).map(device => (
                        <div key={device} style={{ color: 'red', marginLeft: '10px' }}>
                            {device} - No Generator config
                        </div>
                    ))}
                </div>
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