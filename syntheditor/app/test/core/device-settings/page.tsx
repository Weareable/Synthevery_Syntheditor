"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { mesh } from '@/lib/synthevery-core/connection/mesh';
import { getAddressFromString, getAddressString } from '@/lib/synthevery-core/connection/util';
import { deviceConfigManager } from '@/lib/synthevery-core/device/device-config-manager';
import { deviceController } from '@/lib/synthevery-core/device/controller';
import { sendSettingsConfigUpdate } from '@/lib/synthevery-core/device/config';

interface EventLog {
    timestamp: Date;
    type: 'INFO' | 'REQUEST' | 'SEND' | 'RECEIVE' | 'ERROR' | 'CONNECT' | 'DISCONNECT';
    message: string;
    data?: any;
}

const DeviceSettingsTestPage: React.FC = () => {
    const [peerDevices, setPeerDevices] = useState<string[]>([]);
    const [settingsConfigs, setSettingsConfigs] = useState<Map<string, any>>(new Map());
    const [namespaceInput, setNamespaceInput] = useState<string>('core.player');
    const [jsonInput, setJsonInput] = useState<string>('{}');
    const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
    const [expandedDevice, setExpandedDevice] = useState<string>('');

    const addEventLog = useCallback((type: EventLog['type'], message: string, data?: any) => {
        const newLog: EventLog = { timestamp: new Date(), type, message, data };
        setEventLogs(prev => [newLog, ...prev.slice(0, 49)]);
    }, []);

    const connectDevice = useCallback(async () => {
        try {
            await mesh.connectDevice();
            addEventLog('INFO', 'デバイス接続を試行しました');
        } catch (e) {
            addEventLog('ERROR', 'デバイス接続に失敗しました', e);
        }
    }, [addEventLog]);

    const updatePeerDevices = useCallback(() => {
        const all = mesh.getConnectedDevices().map(d => getAddressString(d));
        setPeerDevices(all);
        addEventLog('INFO', `デバイス一覧を更新しました: ${all.length}件`);
    }, [addEventLog]);

    const updateSettings = useCallback(() => {
        setSettingsConfigs(new Map(deviceConfigManager.getAllSettingsConfigs()));
    }, []);

    const namespaces = useMemo(() => namespaceInput.split('.').map(s => s.trim()).filter(Boolean), [namespaceInput]);

    const sendUpdate = useCallback((peer: string) => {
        let payload: any;
        try {
            payload = jsonInput.trim() ? JSON.parse(jsonInput) : {};
        } catch (e) {
            addEventLog('ERROR', 'JSONの構文エラーです', e);
            return;
        }
        if (namespaces.length === 0) {
            addEventLog('ERROR', 'ネームスペースが空です');
            return;
        }
        const addr = getAddressFromString(peer);
        const ok = sendSettingsConfigUpdate(addr, namespaces, payload);
        if (!ok) {
            addEventLog('ERROR', `${peer} への送信に失敗しました`);
        } else {
            addEventLog('SEND', `${peer} に設定更新を送信しました`, { path: namespaces.join('.'), payload });
        }
    }, [jsonInput, namespaces, addEventLog]);

    const requestCurrent = useCallback((peer: string) => {
        if (namespaces.length === 0) {
            addEventLog('ERROR', 'ネームスペースが空です');
            return;
        }
        const addr = getAddressFromString(peer);
        deviceController.requestSettingsConfig(addr, namespaces);
        addEventLog('REQUEST', `${peer} に現在の設定を要求しました`, { path: namespaces.join('.') });
    }, [namespaces, addEventLog]);

    const sendAll = useCallback(() => {
        peerDevices.forEach(p => sendUpdate(p));
    }, [peerDevices, sendUpdate]);

    const requestAll = useCallback(() => {
        peerDevices.forEach(p => requestCurrent(p));
    }, [peerDevices, requestCurrent]);

    useEffect(() => {
        const handleSettingsReceived = (device: any, config: any) => {
            const deviceStr = getAddressString(device);
            addEventLog('RECEIVE', `${deviceStr} からSettingsConfigを受信しました`);
            setSettingsConfigs(prev => new Map(prev).set(deviceStr, config));
        };
        const handleDeviceConnected = (device: any) => {
            addEventLog('CONNECT', `${getAddressString(device)} が接続されました`);
            updatePeerDevices();
        };
        const handleDeviceDisconnected = (device: any) => {
            addEventLog('DISCONNECT', `${getAddressString(device)} が切断されました`);
            updatePeerDevices();
            updateSettings();
        };

        deviceConfigManager.eventEmitter.on('settingsConfigReceived', handleSettingsReceived);
        deviceConfigManager.eventEmitter.on('deviceConnected', handleDeviceConnected);
        deviceConfigManager.eventEmitter.on('deviceDisconnected', handleDeviceDisconnected);

        mesh.eventEmitter.on('peerConnected', updatePeerDevices);
        mesh.eventEmitter.on('peerDisconnected', updatePeerDevices);

        updatePeerDevices();
        updateSettings();
        addEventLog('INFO', 'DeviceSettings テストページを初期化しました');

        return () => {
            deviceConfigManager.eventEmitter.off('settingsConfigReceived', handleSettingsReceived);
            deviceConfigManager.eventEmitter.off('deviceConnected', handleDeviceConnected);
            deviceConfigManager.eventEmitter.off('deviceDisconnected', handleDeviceDisconnected);
            mesh.eventEmitter.removeListener('peerConnected', updatePeerDevices);
            mesh.eventEmitter.removeListener('peerDisconnected', updatePeerDevices);
        };
    }, [addEventLog, updatePeerDevices, updateSettings]);

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ color: '#333', marginBottom: '16px' }}>Device Settings テストページ</h1>

            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0f8ff', borderRadius: 8 }}>
                <h3>コントロール</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    <button onClick={connectDevice} style={{ padding: '8px 16px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>デバイス接続</button>
                    <button onClick={updatePeerDevices} style={{ padding: '8px 16px', background: '#2196F3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>デバイス一覧更新</button>
                </div>
                <div style={{ marginTop: 12 }}>
                    <div style={{ marginBottom: 6 }}><strong>ネームスペース</strong></div>
                    <input value={namespaceInput} onChange={e => setNamespaceInput(e.target.value)} placeholder="core.player.metronome" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 }} />
                </div>
                <div style={{ marginTop: 12 }}>
                    <div style={{ marginBottom: 6 }}><strong>JSON</strong></div>
                    <textarea value={jsonInput} onChange={e => setJsonInput(e.target.value)} rows={8} placeholder={`{\n  "enabled": true\n}`} style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 4, fontFamily: 'monospace', fontSize: 14 }} />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <button onClick={sendAll} disabled={namespaces.length === 0} style={{ padding: '8px 16px', background: namespaces.length === 0 ? '#A5D6A7' : '#4CAF50', color: '#fff', border: 'none', borderRadius: 4, cursor: namespaces.length === 0 ? 'not-allowed' : 'pointer' }}>全デバイスへ送信</button>
                    <button onClick={requestAll} disabled={namespaces.length === 0} style={{ padding: '8px 16px', background: namespaces.length === 0 ? '#B0BEC5' : '#607D8B', color: '#fff', border: 'none', borderRadius: 4, cursor: namespaces.length === 0 ? 'not-allowed' : 'pointer' }}>全デバイスから取得</button>
                </div>
                <div style={{ marginTop: 10 }}><strong>接続デバイス数: {peerDevices.length}</strong></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                    <h3>デバイス一覧と設定</h3>
                    {peerDevices.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>接続中のデバイスがありません</div>
                    ) : (
                        peerDevices.map(device => (
                            <div key={device} style={{ marginBottom: 16, padding: 12, border: '1px solid #ddd', borderRadius: 8, background: '#fff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong>{device}</strong>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => sendUpdate(device)} disabled={namespaces.length === 0} style={{ padding: '6px 12px', background: namespaces.length === 0 ? '#A5D6A7' : '#4CAF50', color: '#fff', border: 'none', borderRadius: 4, cursor: namespaces.length === 0 ? 'not-allowed' : 'pointer' }}>送信</button>
                                        <button onClick={() => requestCurrent(device)} disabled={namespaces.length === 0} style={{ padding: '6px 12px', background: namespaces.length === 0 ? '#90CAF9' : '#2196F3', color: '#fff', border: 'none', borderRadius: 4, cursor: namespaces.length === 0 ? 'not-allowed' : 'pointer' }}>取得</button>
                                        <button onClick={() => setExpandedDevice(expandedDevice === device ? '' : device)} style={{ padding: '6px 12px', background: '#607D8B', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>{expandedDevice === device ? '折りたたむ' : '展開'}</button>
                                    </div>
                                </div>
                                {expandedDevice === device && (
                                    <div style={{ marginTop: 10 }}>
                                        <div style={{ fontSize: '0.9em', marginBottom: 6 }}><strong>受信済み設定</strong></div>
                                        <pre style={{ fontSize: '0.85em', whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                                            {settingsConfigs.has(device) ? JSON.stringify(settingsConfigs.get(device), null, 2) : '—'}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div>
                    <h3>イベントログ</h3>
                    <div style={{ maxHeight: 600, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 8, background: '#fff' }}>
                        {eventLogs.length === 0 ? (
                            <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>イベントログがありません</div>
                        ) : (
                            eventLogs.map((log, idx) => (
                                <div key={idx} style={{ padding: 10, borderBottom: '1px solid #eee', background: log.type === 'ERROR' ? '#ffebee' : log.type === 'RECEIVE' ? '#e8f5e8' : log.type === 'SEND' ? '#e3f2fd' : log.type === 'CONNECT' ? '#fff3e0' : log.type === 'DISCONNECT' ? '#fce4ec' : '#fafafa' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <span style={{ padding: '2px 6px', borderRadius: 3, fontSize: '0.8em', background: log.type === 'ERROR' ? '#f44336' : log.type === 'RECEIVE' ? '#4caf50' : log.type === 'SEND' ? '#2196f3' : log.type === 'CONNECT' ? '#ff9800' : log.type === 'DISCONNECT' ? '#e91e63' : '#9e9e9e', color: '#fff' }}>{log.type}</span>
                                        <span style={{ fontSize: '0.8em', color: '#666' }}>{log.timestamp.toLocaleTimeString()}</span>
                                    </div>
                                    <div style={{ fontSize: '0.9em' }}>{log.message}</div>
                                    {log.data && (
                                        <details style={{ marginTop: 5 }}>
                                            <summary style={{ cursor: 'pointer', fontSize: '0.8em', color: '#666' }}>詳細データ</summary>
                                            <pre style={{ fontSize: '0.8em', margin: '5px 0', whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 5, borderRadius: 3 }}>{JSON.stringify(log.data, null, 2)}</pre>
                                        </details>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceSettingsTestPage;


