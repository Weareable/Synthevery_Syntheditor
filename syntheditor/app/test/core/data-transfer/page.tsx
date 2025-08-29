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
        <div className="light min-h-screen bg-background text-foreground p-6">
            <div className="mb-6">
                <button
                    onClick={() => connectDevice()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                    Connect
                </button>
                <button
                    onClick={updatePeerDevices}
                    className="ml-3 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                >
                    Refresh Device List
                </button>
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
                    className="ml-3 px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/80 transition-colors"
                >
                    Request All Missing Configs
                </button>
            </div>

            <div className="mb-6 p-4 bg-card text-card-foreground rounded-lg border">
                <h4 className="text-lg font-semibold mb-3">Debug Info:</h4>
                <div className="space-y-2">
                    <div>Connected Devices: {peerDevices.join(', ')}</div>
                    <div>Device Configs: {Array.from(deviceConfigs.keys()).join(', ')}</div>
                    <div>Generator Configs: {Array.from(generatorConfigs.keys()).join(', ')}</div>
                    <div className="mt-3">
                        <strong>Missing Configs:</strong>
                        {peerDevices.filter(device => !deviceConfigs.has(device)).map(device => (
                            <div key={device} className="text-destructive ml-3">
                                {device} - No NoteBuilder config
                            </div>
                        ))}
                        {peerDevices.filter(device => !generatorConfigs.has(device)).map(device => (
                            <div key={device} className="text-destructive ml-3">
                                {device} - No Generator config
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-4">Connected Devices:</h3>
                {peerDevices.map(device => (
                    <div key={device} className="mb-6 p-4 border border-border rounded-lg bg-card">
                        <strong className="text-lg">{device}</strong>
                        <div className="mt-3 space-x-3">
                            <button
                                onClick={() => sendConfig(device)}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                            >
                                Send Config
                            </button>
                            <button
                                onClick={() => retrieveConfig(device)}
                                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                            >
                                Get NoteBuilder Config
                            </button>
                            <button
                                onClick={() => retrieveGeneratorConfig(device)}
                                className="px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/80 transition-colors"
                            >
                                Get Generator Config
                            </button>
                        </div>
                        {deviceConfigs.has(device) && (
                            <div className="mt-3 ml-5 text-sm">
                                <strong>NoteBuilder Config:</strong>
                                <pre className="mt-1 p-2 bg-muted rounded border text-xs overflow-x-auto">
                                    {JSON.stringify(deviceConfigs.get(device), null, 2)}
                                </pre>
                            </div>
                        )}
                        {generatorConfigs.has(device) && (
                            <div className="mt-3 ml-5 text-sm">
                                <strong>Generator Config:</strong>
                                <pre className="mt-1 p-2 bg-muted rounded border text-xs overflow-x-auto">
                                    {JSON.stringify(generatorConfigs.get(device), null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DataTransferExample;