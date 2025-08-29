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
        <div className="light min-h-screen bg-background text-foreground p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-6">Device Settings テストページ</h1>

            <div className="mb-6 p-4 bg-card text-card-foreground rounded-lg border">
                <h3 className="text-lg font-semibold mb-3">コントロール</h3>
                <div className="flex gap-2 flex-wrap mt-2">
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
                </div>
                <div className="mt-3">
                    <div className="mb-2 font-semibold">ネームスペース</div>
                    <input
                        value={namespaceInput}
                        onChange={e => setNamespaceInput(e.target.value)}
                        placeholder="core.player.metronome"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <div className="mt-3">
                    <div className="mb-2 font-semibold">JSON</div>
                    <textarea
                        value={jsonInput}
                        onChange={e => setJsonInput(e.target.value)}
                        rows={8}
                        placeholder={`{\n  "enabled": true\n}`}
                        className="w-full p-3 border border-border rounded-md bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-vertical"
                    />
                </div>
                <div className="flex gap-2 flex-wrap mt-3">
                    <button
                        onClick={sendAll}
                        disabled={namespaces.length === 0}
                        className={`px-4 py-2 rounded-md transition-colors ${namespaces.length === 0
                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }`}
                    >
                        全デバイスへ送信
                    </button>
                    <button
                        onClick={requestAll}
                        disabled={namespaces.length === 0}
                        className={`px-4 py-2 rounded-md transition-colors ${namespaces.length === 0
                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                    >
                        全デバイスから取得
                    </button>
                </div>
                <div className="mt-3 font-semibold">接続デバイス数: {peerDevices.length}</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-semibold mb-3">デバイス一覧と設定</h3>
                    {peerDevices.length === 0 ? (
                        <div className="p-5 text-center text-muted-foreground">接続中のデバイスがありません</div>
                    ) : (
                        peerDevices.map(device => (
                            <div key={device} className="mb-4 p-3 border border-border rounded-lg bg-card">
                                <div className="flex justify-between items-center">
                                    <strong className="text-foreground">{device}</strong>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => sendUpdate(device)}
                                            disabled={namespaces.length === 0}
                                            className={`px-3 py-1 rounded text-sm transition-colors ${namespaces.length === 0
                                                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                }`}
                                        >
                                            送信
                                        </button>
                                        <button
                                            onClick={() => requestCurrent(device)}
                                            disabled={namespaces.length === 0}
                                            className={`px-3 py-1 rounded text-sm transition-colors ${namespaces.length === 0
                                                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                }`}
                                        >
                                            取得
                                        </button>
                                        <button
                                            onClick={() => setExpandedDevice(expandedDevice === device ? '' : device)}
                                            className="px-3 py-1 rounded text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                                        >
                                            {expandedDevice === device ? '折りたたむ' : '展開'}
                                        </button>
                                    </div>
                                </div>
                                {expandedDevice === device && (
                                    <div className="mt-3">
                                        <div className="text-sm font-semibold mb-2">受信済み設定</div>
                                        <pre className="text-xs whitespace-pre-wrap bg-muted p-2 rounded border">
                                            {settingsConfigs.has(device) ? JSON.stringify(settingsConfigs.get(device), null, 2) : '—'}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-3">イベントログ</h3>
                    <div className="max-h-96 overflow-y-auto border border-border rounded-lg bg-card">
                        {eventLogs.length === 0 ? (
                            <div className="p-5 text-center text-muted-foreground">イベントログがありません</div>
                        ) : (
                            eventLogs.map((log, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 border-b border-border ${log.type === 'ERROR' ? 'bg-destructive/10' :
                                        log.type === 'RECEIVE' ? 'bg-green-50' :
                                            log.type === 'SEND' ? 'bg-blue-50' :
                                                log.type === 'CONNECT' ? 'bg-orange-50' :
                                                    log.type === 'DISCONNECT' ? 'bg-pink-50' :
                                                        'bg-muted/50'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${log.type === 'ERROR' ? 'bg-destructive text-destructive-foreground' :
                                            log.type === 'RECEIVE' ? 'bg-green-600 text-white' :
                                                log.type === 'SEND' ? 'bg-blue-600 text-white' :
                                                    log.type === 'CONNECT' ? 'bg-orange-600 text-white' :
                                                        log.type === 'DISCONNECT' ? 'bg-pink-600 text-white' :
                                                            'bg-muted text-muted-foreground'
                                            }`}>
                                            {log.type}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{log.timestamp.toLocaleTimeString()}</span>
                                    </div>
                                    <div className="text-sm">{log.message}</div>
                                    {log.data && (
                                        <details className="mt-2">
                                            <summary className="cursor-pointer text-xs text-muted-foreground">詳細データ</summary>
                                            <pre className="text-xs mt-2 whitespace-pre-wrap bg-muted p-2 rounded border">
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
        </div>
    );
};

export default DeviceSettingsTestPage;


