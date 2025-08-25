'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { mesh } from '@/lib/synthevery-core/connection/mesh';
import { getAddressFromString, getAddressString } from '@/lib/synthevery-core/connection/util';
import { deviceConfigManager } from '@/lib/synthevery-core/device/device-config-manager';
import { sendNoteBuilderConfig, sendGeneratorConfig, sendTrackDetail, sendBodyColorConfig, sendLedColorConfig } from '@/lib/synthevery-core/device/config';
import { NoteBuilderConfig, GeneratorConfig, TrackDetail, BodyColorConfig, LedColorConfig } from '@/lib/synthevery-core/types/player';
import { P2PMacAddress } from '@/lib/synthevery-core/types/mesh';
import { deviceController } from '@/lib/synthevery-core/device/controller';

interface EventLog {
    timestamp: Date;
    type: string;
    message: string;
    data?: any;
}

const DeviceConfigManagerTestPage: React.FC = () => {
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
                    sendNoteBuilderConfig(peerAddress, noteBuilderConfig);
                    addEventLog('SEND', `${peer}にNoteBuilderConfigを送信しました`, noteBuilderConfig);
                    break;

                case 'generator':
                    const generatorConfig: GeneratorConfig[] = [
                        { class: "sf", params: { filename: "/rock_drum.sf2", preset_index: 9, is_drum: true } },
                        { class: "sf", params: { filename: "/piano.sf2", preset_index: 0, is_drum: false } }
                    ];
                    sendGeneratorConfig(peerAddress, generatorConfig);
                    addEventLog('SEND', `${peer}にGeneratorConfigを送信しました`, generatorConfig);
                    break;

                case 'trackDetail':
                    const trackDetail: TrackDetail[] = [
                        { displayName: "Track 1", icon: "drum", instrumentPresetId: "preset1" },
                        { displayName: "Track 2", icon: "piano", instrumentPresetId: "preset2" }
                    ];
                    sendTrackDetail(peerAddress, trackDetail);
                    addEventLog('SEND', `${peer}にTrackDetailを送信しました`, trackDetail);
                    break;

                case 'bodyColor':
                    const bodyColorConfig: BodyColorConfig = { body_color: "#0000FF" };
                    sendBodyColorConfig(peerAddress, bodyColorConfig);
                    addEventLog('SEND', `${peer}にBodyColorConfigを送信しました`, bodyColorConfig);
                    break;

                case 'ledColor':
                    const ledColorConfig: LedColorConfig = { base_led_color: "#FFFF00" };
                    sendLedColorConfig(peerAddress, ledColorConfig);
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
            <div className="config-display" style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <strong>{title}:</strong>
                <pre style={{ fontSize: '0.8em', margin: '5px 0', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        );
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ color: '#333', marginBottom: '20px' }}>DeviceConfigManager テストページ</h1>

            {/* コントロールパネル */}
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
                <h3>コントロールパネル</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <button
                        onClick={connectDevice}
                        style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        デバイス接続
                    </button>
                    <button
                        onClick={updatePeerDevices}
                        style={{ padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        デバイス一覧更新
                    </button>
                    <button
                        onClick={clearAllConfigs}
                        style={{ padding: '8px 16px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        設定クリア
                    </button>
                    <button
                        onClick={clearEventLogs}
                        style={{ padding: '8px 16px', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        ログクリア
                    </button>
                </div>

                <div style={{ marginTop: '10px' }}>
                    <strong>メッシュネットワーク全体のデバイス数: {peerDevices.length}</strong>
                </div>
            </div>

            {/* 設定要求セクション */}
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e0f2f7', borderRadius: '8px' }}>
                <h3>設定要求</h3>
                <div style={{ marginBottom: '10px', fontSize: '0.9em', color: '#666' }}>
                    ネームスペースを入力してから、デバイスに設定要求を送信してください（例: core.player.metronome）
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.9em', color: '#555' }}>ネームスペース:</label>
                    <input
                        type="text"
                        value={selectedNamespaces.join('.')}
                        onChange={handleNamespaceInputChange}
                        onKeyDown={handleNamespaceInputComplete}
                        placeholder="core.player.metronome"
                        style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9em' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {peerDevices.map(peer => (
                        <button
                            key={peer}
                            onClick={() => requestSettingsConfig(peer, selectedNamespaces)}
                            style={{ padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em' }}
                        >
                            {peer}に設定要求
                        </button>
                    ))}
                </div>
            </div>

            {/* メインコンテンツ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* 左側: デバイス一覧と設定表示 */}
                <div>
                    <h3>メッシュネットワーク全体のデバイス一覧と設定</h3>
                    {peerDevices.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                            メッシュネットワークに接続されているデバイスがありません
                        </div>
                    ) : (
                        peerDevices.map(device => (
                            <div key={device} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <strong style={{ fontSize: '1.1em' }}>{device}</strong>
                                    <button
                                        onClick={() => setSelectedDevice(selectedDevice === device ? '' : device)}
                                        style={{ padding: '4px 8px', backgroundColor: '#607D8B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        {selectedDevice === device ? '折りたたむ' : '展開'}
                                    </button>
                                </div>

                                {selectedDevice === device && (
                                    <>
                                        {/* 設定送信ボタン */}
                                        <div style={{ marginBottom: '15px' }}>
                                            <h4>設定送信</h4>
                                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                                {['noteBuilder', 'generator', 'trackDetail', 'bodyColor', 'ledColor'].map(configType => (
                                                    <button
                                                        key={configType}
                                                        onClick={() => sendConfig(device, configType)}
                                                        style={{ padding: '6px 12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em' }}
                                                    >
                                                        {configType}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 設定取得ボタン */}
                                        <div style={{ marginBottom: '15px' }}>
                                            <h4>設定取得</h4>
                                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                                {['noteBuilder', 'generator', 'trackDetail', 'bodyColor', 'ledColor'].map(configType => (
                                                    <button
                                                        key={configType}
                                                        onClick={() => retrieveConfig(device, configType)}
                                                        style={{ padding: '6px 12px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em' }}
                                                    >
                                                        {configType}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 設定表示 */}
                                        <div>
                                            <h4>受信済み設定</h4>
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
                    <h3>イベントログ</h3>
                    <div style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' }}>
                        {eventLogs.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                イベントログがありません
                            </div>
                        ) : (
                            eventLogs.map((log, index) => (
                                <div key={index} style={{
                                    padding: '10px',
                                    borderBottom: '1px solid #eee',
                                    backgroundColor: log.type === 'ERROR' ? '#ffebee' :
                                        log.type === 'RECEIVE' ? '#e8f5e8' :
                                            log.type === 'SEND' ? '#e3f2fd' :
                                                log.type === 'CONNECT' ? '#fff3e0' :
                                                    log.type === 'DISCONNECT' ? '#fce4ec' : '#fafafa'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '3px',
                                            fontSize: '0.8em',
                                            backgroundColor: log.type === 'ERROR' ? '#f44336' :
                                                log.type === 'RECEIVE' ? '#4caf50' :
                                                    log.type === 'SEND' ? '#2196f3' :
                                                        log.type === 'CONNECT' ? '#ff9800' :
                                                            log.type === 'DISCONNECT' ? '#e91e63' : '#9e9e9e',
                                            color: 'white'
                                        }}>
                                            {log.type}
                                        </span>
                                        <span style={{ fontSize: '0.8em', color: '#666' }}>
                                            {log.timestamp.toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.9em' }}>{log.message}</div>
                                    {log.data && (
                                        <details style={{ marginTop: '5px' }}>
                                            <summary style={{ cursor: 'pointer', fontSize: '0.8em', color: '#666' }}>詳細データ</summary>
                                            <pre style={{ fontSize: '0.8em', margin: '5px 0', whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '5px', borderRadius: '3px' }}>
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
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <h3>統計情報</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#4CAF50' }}>{peerDevices.length}</div>
                        <div>メッシュネットワーク全体のデバイス</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#2196F3' }}>{deviceConfigs.size}</div>
                        <div>NoteBuilder設定</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#FF9800' }}>{generatorConfigs.size}</div>
                        <div>Generator設定</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#9C27B0' }}>{eventLogs.length}</div>
                        <div>イベントログ</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceConfigManagerTestPage;
