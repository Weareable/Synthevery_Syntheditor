'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSynthevery } from '@/contexts/SyntheveryContext';
import { getAddressFromString, getAddressString } from '@/lib/synthevery-core/connection/util';
import { sendNoteBuilderConfig, sendGeneratorConfig, sendTrackDetail, sendBodyColorConfig, sendLedColorConfig } from '@/lib/synthevery-core/device/config';
import { NoteBuilderConfig, GeneratorConfig, TrackDetail, BodyColorConfig, LedColorConfig } from '@/lib/synthevery-core/types/player';
import { P2PMacAddress } from '@/lib/synthevery-core/types/mesh';

interface EventLog {
    timestamp: Date;
    type: string;
    message: string;
    data?: any;
}

const DeviceConfigManagerTestPage: React.FC = () => {
    const { mesh, deviceConfigManager, deviceController, dataTransferController } = useSynthevery();
    const [peerDevices, setPeerDevices] = useState<string[]>([]);
    const [deviceConfigs, setDeviceConfigs] = useState<Map<string, NoteBuilderConfig[]>>(new Map());
    const [generatorConfigs, setGeneratorConfigs] = useState<Map<string, GeneratorConfig[]>>(new Map());
    const [trackDetails, setTrackDetails] = useState<Map<string, TrackDetail[]>>(new Map());
    const [bodyColorConfigs, setBodyColorConfigs] = useState<Map<string, BodyColorConfig>>(new Map());
    const [ledColorConfigs, setLedColorConfigs] = useState<Map<string, LedColorConfig>>(new Map());
    const [settingsConfigs, setSettingsConfigs] = useState<Map<string, any>>(new Map());
    const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string>('');
    const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>(['core', 'player']);

    // イベントログを追加する関数
    const addEventLog = useCallback((type: string, message: string, data?: any) => {
        const newLog: EventLog = {
            timestamp: new Date(),
            type,
            message,
            data
        };
        setEventLogs(prev => [newLog, ...prev.slice(0, 49)]); // 最新50件を保持
    }, []);

    // デバイス接続
    const connectDevice = async () => {
        try {
            await mesh.connectDevice();
            addEventLog('ACTION', 'デバイス接続を試行しました');
        } catch (error) {
            addEventLog('ERROR', 'デバイス接続に失敗しました', error);
        }
    };

    // メッシュネットワーク全体のデバイス一覧を更新
    const updatePeerDevices = useCallback(() => {
        const allDevices = mesh.getConnectedDevices().map(device => getAddressString(device));
        setPeerDevices(allDevices);
        addEventLog('INFO', `メッシュネットワーク全体のデバイス一覧を更新しました: ${allDevices.length}件`);
    }, [addEventLog]);

    // 設定データを更新
    const updateConfigs = useCallback(() => {
        setDeviceConfigs(new Map(deviceConfigManager.getAllConfigs()));
        setGeneratorConfigs(new Map(deviceConfigManager.getAllGeneratorConfigs()));
        setTrackDetails(new Map(deviceConfigManager.getAllTrackDetails()));
        setBodyColorConfigs(new Map(deviceConfigManager.getAllBodyColorConfigs()));
        setLedColorConfigs(new Map(deviceConfigManager.getAllLedColorConfigs()));
        setSettingsConfigs(new Map(deviceConfigManager.getAllSettingsConfigs()));
    }, []);

    // 設定を送信
    const sendConfig = useCallback((peer: string, configType: string) => {
        const peerAddress = getAddressFromString(peer);

        try {
            switch (configType) {
                case 'noteBuilder':
                    const noteBuilderConfig: NoteBuilderConfig[] = [
                        { type: "bongo" },
                        { type: "drum" },
                        { type: "synth" }
                    ];
                    sendNoteBuilderConfig(dataTransferController, peerAddress, noteBuilderConfig);
                    addEventLog('SEND', `${peer}にNoteBuilderConfigを送信しました`, noteBuilderConfig);
                    break;

                case 'generator':
                    const generatorConfig: GeneratorConfig[] = [
                        { class: "sf", params: { filename: "/rock_drum.sf2", preset_index: 9, is_drum: true } },
                        { class: "sf", params: { filename: "/piano.sf2", preset_index: 0, is_drum: false } }
                    ];
                    sendGeneratorConfig(dataTransferController, peerAddress, generatorConfig);
                    addEventLog('SEND', `${peer}にGeneratorConfigを送信しました`, generatorConfig);
                    break;

                case 'trackDetail':
                    const trackDetail: TrackDetail[] = [
                        { displayName: "Track 1", icon: "drum", instrumentPresetId: "preset1" },
                        { displayName: "Track 2", icon: "piano", instrumentPresetId: "preset2" }
                    ];
                    sendTrackDetail(dataTransferController, peerAddress, trackDetail);
                    addEventLog('SEND', `${peer}にTrackDetailを送信しました`, trackDetail);
                    break;

                case 'bodyColor':
                    const bodyColorConfig: BodyColorConfig = { body_color: "#0000FF" };
                    sendBodyColorConfig(dataTransferController, peerAddress, bodyColorConfig);
                    addEventLog('SEND', `${peer}にBodyColorConfigを送信しました`, bodyColorConfig);
                    break;

                case 'ledColor':
                    const ledColorConfig: LedColorConfig = { base_led_color: "#FFFF00" };
                    sendLedColorConfig(dataTransferController, peerAddress, ledColorConfig);
                    addEventLog('SEND', `${peer}にLedColorConfigを送信しました`, ledColorConfig);
                    break;
            }
        } catch (error) {
            addEventLog('ERROR', `${configType}の送信に失敗しました`, error);
        }
    }, [addEventLog]);

    // 設定を取得
    const retrieveConfig = useCallback((peer: string, configType: string) => {
        const peerAddress = getAddressFromString(peer);

        console.log('=== Config Retrieval Debug ===');
        console.log('Peer string:', peer);
        console.log('Peer address object:', peerAddress);
        console.log('DeviceConfigManager state before retrieval:');
        console.log('- All configs:', deviceConfigManager.getAllConfigs());
        console.log('- All generator configs:', deviceConfigManager.getAllGeneratorConfigs());
        console.log('- All track details:', deviceConfigManager.getAllTrackDetails());
        console.log('- All body color configs:', deviceConfigManager.getAllBodyColorConfigs());
        console.log('- All LED color configs:', deviceConfigManager.getAllLedColorConfigs());
        console.log('- Config keys (strings):', Array.from(deviceConfigManager.getAllConfigs().keys()));
        console.log('- Generator config keys (strings):', Array.from(deviceConfigManager.getAllGeneratorConfigs().keys()));
        console.log('- Track detail keys (strings):', Array.from(deviceConfigManager.getAllTrackDetails().keys()));

        try {
            let config: any;
            switch (configType) {
                case 'noteBuilder':
                    config = deviceConfigManager.getConfig(peerAddress);
                    console.log('NoteBuilder config retrieved:', config);
                    addEventLog('RETRIEVE', `${peer}のNoteBuilderConfigを取得しました`, config);
                    break;
                case 'generator':
                    config = deviceConfigManager.getGeneratorConfig(peerAddress);
                    console.log('Generator config retrieved:', config);
                    addEventLog('RETRIEVE', `${peer}のGeneratorConfigを取得しました`, config);
                    break;
                case 'trackDetail':
                    config = deviceConfigManager.getTrackDetail(peerAddress);
                    console.log('Track detail retrieved:', config);
                    addEventLog('RETRIEVE', `${peer}のTrackDetailを取得しました`, config);
                    break;
                case 'bodyColor':
                    config = deviceConfigManager.getBodyColorConfig(peerAddress);
                    console.log('Body color config retrieved:', config);
                    addEventLog('RETRIEVE', `${peer}のBodyColorConfigを取得しました`, config);
                    break;
                case 'ledColor':
                    config = deviceConfigManager.getLedColorConfig(peerAddress);
                    console.log('LED color config retrieved:', config);
                    addEventLog('RETRIEVE', `${peer}のLedColorConfigを取得しました`, config);
                    break;
            }
            console.log(`Retrieved ${configType} for ${peer}:`, config);
            console.log('DeviceConfigManager state after retrieval:');
            console.log('- All configs:', deviceConfigManager.getAllConfigs());
            console.log('- All generator configs:', deviceConfigManager.getAllGeneratorConfigs());
            console.log('- All track details:', deviceConfigManager.getAllTrackDetails());
        } catch (error) {
            console.error('Config retrieval error:', error);
            addEventLog('ERROR', `${configType}の取得に失敗しました`, error);
        }
    }, [addEventLog]);

    // 全設定をクリア
    const clearAllConfigs = useCallback(() => {
        setDeviceConfigs(new Map());
        setGeneratorConfigs(new Map());
        setTrackDetails(new Map());
        setBodyColorConfigs(new Map());
        setLedColorConfigs(new Map());
        addEventLog('ACTION', '全設定データをクリアしました');
    }, [addEventLog]);

    // イベントログをクリア
    const clearEventLogs = useCallback(() => {
        setEventLogs([]);
        addEventLog('ACTION', 'イベントログをクリアしました');
    }, [addEventLog]);

    // 設定を要求
    const requestSettingsConfig = useCallback((peer: string, namespaces: string[]) => {
        const peerAddress = getAddressFromString(peer);
        if (peerAddress) {
            deviceController.requestSettingsConfig(peerAddress, namespaces);
            addEventLog('REQUEST', `${peer}に設定要求を送信しました (namespaces: ${namespaces.join('.')})`);
        }
    }, []);

    // ネームスペース入力処理
    const handleNamespaceInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        // 入力値を一時的に保存（リクエストは送信しない）
        setSelectedNamespaces(inputValue.split('.').filter(s => s.trim()));
    }, []);

    // ネームスペース入力完了時の処理
    const handleNamespaceInputComplete = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur(); // フォーカスを外す
        }
    }, []);

    useEffect(() => {
        // deviceConfigManagerのイベントリスナーを設定
        const handleNoteBuilderConfigReceived = (device: P2PMacAddress, config: NoteBuilderConfig[]) => {
            const deviceStr = getAddressString(device);
            addEventLog('RECEIVE', `${deviceStr}からNoteBuilderConfigを受信しました`, config);
            updateConfigs();
        };

        const handleGeneratorConfigReceived = (device: P2PMacAddress, config: GeneratorConfig[]) => {
            const deviceStr = getAddressString(device);
            addEventLog('RECEIVE', `${deviceStr}からGeneratorConfigを受信しました`, config);
            updateConfigs();
        };

        const handleTrackDetailReceived = (device: P2PMacAddress, trackDetails: TrackDetail[]) => {
            const deviceStr = getAddressString(device);
            addEventLog('RECEIVE', `${deviceStr}からTrackDetailを受信しました`, trackDetails);
            updateConfigs();
        };

        const handleBodyColorConfigReceived = (device: P2PMacAddress, config: BodyColorConfig) => {
            const deviceStr = getAddressString(device);
            addEventLog('RECEIVE', `${deviceStr}からBodyColorConfigを受信しました`, config);
            updateConfigs();
        };

        const handleLedColorConfigReceived = (device: P2PMacAddress, config: LedColorConfig) => {
            const deviceStr = getAddressString(device);
            addEventLog('RECEIVE', `${deviceStr}からLedColorConfigを受信しました`, config);
            updateConfigs();
        };

        const handleSettingsConfigReceived = (device: P2PMacAddress, config: any) => {
            const deviceStr = getAddressString(device);
            addEventLog('RECEIVE', `${deviceStr}からSettingsConfigを受信しました`, config);
            setSettingsConfigs(prev => new Map(prev).set(deviceStr, config));
        };

        const handleDeviceConnected = (device: P2PMacAddress) => {
            const deviceStr = getAddressString(device);
            addEventLog('CONNECT', `${deviceStr}が接続されました`);
            updatePeerDevices();
        };

        const handleDeviceDisconnected = (device: P2PMacAddress) => {
            const deviceStr = getAddressString(device);
            addEventLog('DISCONNECT', `${deviceStr}が切断されました`);
            updatePeerDevices();
            updateConfigs();
        };

        // イベントリスナーを登録
        deviceConfigManager.eventEmitter.on('noteBuilderConfigReceived', handleNoteBuilderConfigReceived);
        deviceConfigManager.eventEmitter.on('generatorConfigReceived', handleGeneratorConfigReceived);
        deviceConfigManager.eventEmitter.on('trackDetailReceived', handleTrackDetailReceived);
        deviceConfigManager.eventEmitter.on('bodyColorConfigReceived', handleBodyColorConfigReceived);
        deviceConfigManager.eventEmitter.on('ledColorConfigReceived', handleLedColorConfigReceived);
        deviceConfigManager.eventEmitter.on('settingsConfigReceived', handleSettingsConfigReceived);
        deviceConfigManager.eventEmitter.on('deviceConnected', handleDeviceConnected);
        deviceConfigManager.eventEmitter.on('deviceDisconnected', handleDeviceDisconnected);

        // meshのイベントリスナーを設定
        mesh.eventEmitter.on('peerConnected', updatePeerDevices);
        mesh.eventEmitter.on('peerDisconnected', updatePeerDevices);

        // 初期化
        updatePeerDevices();
        updateConfigs();
        addEventLog('INFO', 'DeviceConfigManagerテストページが初期化されました');

        return () => {
            // イベントリスナーを削除
            deviceConfigManager.eventEmitter.off('noteBuilderConfigReceived', handleNoteBuilderConfigReceived);
            deviceConfigManager.eventEmitter.off('generatorConfigReceived', handleGeneratorConfigReceived);
            deviceConfigManager.eventEmitter.off('trackDetailReceived', handleTrackDetailReceived);
            deviceConfigManager.eventEmitter.off('bodyColorConfigReceived', handleBodyColorConfigReceived);
            deviceConfigManager.eventEmitter.off('ledColorConfigReceived', handleLedColorConfigReceived);
            deviceConfigManager.eventEmitter.off('settingsConfigReceived', handleSettingsConfigReceived);
            deviceConfigManager.eventEmitter.off('deviceConnected', handleDeviceConnected);
            deviceConfigManager.eventEmitter.off('deviceDisconnected', handleDeviceDisconnected);

            mesh.eventEmitter.removeListener('peerConnected', updatePeerDevices);
            mesh.eventEmitter.removeListener('peerDisconnected', updatePeerDevices);
        };
    }, [updatePeerDevices, updateConfigs, addEventLog]);

    // 設定データを表示するコンポーネント
    const ConfigDisplay: React.FC<{ title: string; data: any; device: string }> = ({ title, data, device }) => {
        if (!data) return null;

        return (
            <div className="mt-3 p-3 bg-muted rounded-md">
                <strong className="text-foreground">{title}:</strong>
                <pre className="text-xs mt-2 whitespace-pre-wrap bg-background p-2 rounded border">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        );
    };

    return (
        <div className="light min-h-screen bg-background text-foreground p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">DeviceConfigManager テストページ</h1>

            {/* コントロールパネル */}
            <div className="mb-6 p-4 bg-card text-card-foreground rounded-lg border">
                <h3 className="text-lg font-semibold mb-3">コントロールパネル</h3>
                <div className="flex gap-3 flex-wrap mb-3">
                    <button
                        onClick={connectDevice}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                        デバイス接続
                    </button>
                    <button
                        onClick={updatePeerDevices}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                    >
                        デバイス一覧更新
                    </button>
                    <button
                        onClick={clearAllConfigs}
                        className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                    >
                        設定クリア
                    </button>
                    <button
                        onClick={clearEventLogs}
                        className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                    >
                        ログクリア
                    </button>
                </div>

                <div className="font-semibold">
                    メッシュネットワーク全体のデバイス数: {peerDevices.length}
                </div>
            </div>

            {/* 設定要求セクション */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border">
                <h3 className="text-lg font-semibold mb-3">設定要求</h3>
                <div className="mb-3 text-sm text-muted-foreground">
                    ネームスペースを入力してから、デバイスに設定要求を送信してください（例: core.player.metronome）
                </div>
                <div className="flex gap-3 flex-wrap mb-3">
                    <label className="text-sm text-foreground">ネームスペース:</label>
                    <input
                        type="text"
                        value={selectedNamespaces.join('.')}
                        onChange={handleNamespaceInputChange}
                        onKeyDown={handleNamespaceInputComplete}
                        placeholder="core.player.metronome"
                        className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <div className="flex gap-3 flex-wrap">
                    {peerDevices.map(peer => (
                        <button
                            key={peer}
                            onClick={() => requestSettingsConfig(peer, selectedNamespaces)}
                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm"
                        >
                            {peer}に設定要求
                        </button>
                    ))}
                </div>
            </div>

            {/* メインコンテンツ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 左側: デバイス一覧と設定表示 */}
                <div>
                    <h3 className="text-xl font-bold mb-3">メッシュネットワーク全体のデバイス一覧と設定</h3>
                    {peerDevices.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                            メッシュネットワークに接続されているデバイスがありません
                        </div>
                    ) : (
                        peerDevices.map(device => (
                            <div key={device} className="mb-6 p-4 border border-border rounded-lg bg-white">
                                <div className="flex justify-between items-center mb-3">
                                    <strong className="text-lg">{device}</strong>
                                    <button
                                        onClick={() => setSelectedDevice(selectedDevice === device ? '' : device)}
                                        className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                                    >
                                        {selectedDevice === device ? '折りたたむ' : '展開'}
                                    </button>
                                </div>

                                {selectedDevice === device && (
                                    <>
                                        {/* 設定送信ボタン */}
                                        <div className="mb-4">
                                            <h4 className="text-md font-semibold mb-2">設定送信</h4>
                                            <div className="flex gap-2 flex-wrap">
                                                {['noteBuilder', 'generator', 'trackDetail', 'bodyColor', 'ledColor'].map(configType => (
                                                    <button
                                                        key={configType}
                                                        onClick={() => sendConfig(device, configType)}
                                                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                                                    >
                                                        {configType}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 設定取得ボタン */}
                                        <div className="mb-4">
                                            <h4 className="text-md font-semibold mb-2">設定取得</h4>
                                            <div className="flex gap-2 flex-wrap">
                                                {['noteBuilder', 'generator', 'trackDetail', 'bodyColor', 'ledColor'].map(configType => (
                                                    <button
                                                        key={configType}
                                                        onClick={() => retrieveConfig(device, configType)}
                                                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                                                    >
                                                        {configType}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 設定表示 */}
                                        <div>
                                            <h4 className="text-md font-semibold mb-2">受信済み設定</h4>
                                            <ConfigDisplay title="NoteBuilderConfig" data={deviceConfigs.get(device)} device={device} />
                                            <ConfigDisplay title="GeneratorConfig" data={generatorConfigs.get(device)} device={device} />
                                            <ConfigDisplay title="TrackDetail" data={trackDetails.get(device)} device={device} />
                                            <ConfigDisplay title="BodyColorConfig" data={bodyColorConfigs.get(device)} device={device} />
                                            <ConfigDisplay title="LedColorConfig" data={ledColorConfigs.get(device)} device={device} />
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* 右側: イベントログ */}
                <div>
                    <h3 className="text-xl font-bold mb-3">イベントログ</h3>
                    <div className="max-h-full overflow-y-auto border border-border rounded-lg bg-white">
                        {eventLogs.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">
                                イベントログがありません
                            </div>
                        ) : (
                            eventLogs.map((log, index) => (
                                <div key={index} className="p-3 border-b border-border">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`px-2 py-1 rounded-md text-xs ${log.type === 'ERROR' ? 'bg-red-500 text-white' :
                                            log.type === 'RECEIVE' ? 'bg-green-500 text-white' :
                                                log.type === 'SEND' ? 'bg-blue-500 text-white' :
                                                    log.type === 'CONNECT' ? 'bg-yellow-500 text-white' :
                                                        log.type === 'DISCONNECT' ? 'bg-purple-500 text-white' : 'bg-gray-500 text-white'
                                            }`}>
                                            {log.type}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {log.timestamp.toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="text-sm">{log.message}</div>
                                    {log.data && (
                                        <details className="mt-2">
                                            <summary className="cursor-pointer text-xs text-muted-foreground">詳細データ</summary>
                                            <pre className="text-xs mt-1 whitespace-pre-wrap bg-background p-2 rounded border">
                                                {JSON.stringify(log.data, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 統計情報 */}
            <div className="mt-6 p-4 bg-gray-100 rounded-lg border">
                <h3 className="text-lg font-semibold mb-3">統計情報</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white rounded-md">
                        <div className="text-3xl font-bold text-green-500">{peerDevices.length}</div>
                        <div>メッシュネットワーク全体のデバイス</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-md">
                        <div className="text-3xl font-bold text-blue-500">{deviceConfigs.size}</div>
                        <div>NoteBuilder設定</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-md">
                        <div className="text-3xl font-bold text-orange-500">{generatorConfigs.size}</div>
                        <div>Generator設定</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-md">
                        <div className="text-3xl font-bold text-purple-500">{eventLogs.length}</div>
                        <div>イベントログ</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceConfigManagerTestPage;
