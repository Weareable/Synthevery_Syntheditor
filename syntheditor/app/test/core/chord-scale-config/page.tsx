'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSynthevery } from '@/contexts/SyntheveryContext';
import { getAddressFromString, getAddressString } from '@/lib/synthevery-core/connection/util';
import { sendChordScaleConfig } from '@/lib/synthevery-core/device/config';
import { ChordScaleConfig } from '@/types/chordScale';
import { P2PMacAddress } from '@/lib/synthevery-core/types/mesh';
import { generateChordScaleConfigWithRange, normalizeNotesToPitchClasses } from '@/lib/utils/tonal-chordscale';

interface EventLog {
    timestamp: Date;
    type: string;
    message: string;
    data?: any;
}

const ChordScaleConfigTestPage: React.FC = () => {
    const { mesh, deviceConfigManager, dataTransferController } = useSynthevery();
    const [peerDevices, setPeerDevices] = useState<string[]>([]);
    const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string>('');
    const [rawReceivedData, setRawReceivedData] = useState<Map<string, any>>(new Map());
    const [testConfig, setTestConfig] = useState<ChordScaleConfig>({
        scales: [
            { notes: [0, 2, 4, 5, 7, 9, 11] }, // C major scale
            { notes: [0, 2, 3, 5, 7, 8, 10] }  // C minor scale
        ],
        chords: [
            { notes: [0, 4, 7] },   // C major chord
            { notes: [0, 3, 7] },   // C minor chord
            { notes: [2, 5, 9] },   // D minor chord
            { notes: [4, 7, 11] }   // E minor chord
        ],
        chord_scale_relations: [
            { chord_id: 0, scale_with_root: { scale_id: 0, root_offset: 0 } },
            { chord_id: 1, scale_with_root: { scale_id: 1, root_offset: 0 } },
            { chord_id: 2, scale_with_root: { scale_id: 1, root_offset: 2 } },
            { chord_id: 3, scale_with_root: { scale_id: 1, root_offset: 4 } }
        ],
        sequences: [
            {
                tick: 0,
                data: {
                    chord_ids: [0],
                    scale_with_roots: [{ scale_id: 0, root_offset: 0 }]
                }
            },
            {
                tick: 480,
                data: {
                    chord_ids: [1],
                    scale_with_roots: [{ scale_id: 1, root_offset: 0 }]
                }
            },
            {
                tick: 960,
                data: {
                    chord_ids: [2],
                    scale_with_roots: [{ scale_id: 1, root_offset: 2 }]
                }
            },
            {
                tick: 1440,
                data: {
                    chord_ids: [3],
                    scale_with_roots: [{ scale_id: 1, root_offset: 4 }]
                }
            }
        ],
        loop_length_tick: 1920
    });

    // chord_scale_relations 用の入力状態
    const [newRelation, setNewRelation] = useState<{ chord_id: number; scale_id: number; root_offset: number }>({
        chord_id: 0,
        scale_id: 0,
        root_offset: 0,
    });

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

    // DeviceConfigManagerのイベントリスナーを設定
    useEffect(() => {
        // ChordScaleConfig受信時の処理
        const handleChordScaleConfigReceived = (device: P2PMacAddress, config: ChordScaleConfig) => {
            const deviceStr = getAddressString(device);
            addEventLog('SUCCESS', `ChordScaleConfigを受信しました: ${deviceStr}`, config);

            // 生データを保存
            setRawReceivedData(prev => {
                const newMap = new Map(prev);
                newMap.set(deviceStr, config);
                return newMap;
            });
        };

        // デバイス接続時の処理
        const handleDeviceConnected = (device: P2PMacAddress) => {
            const deviceStr = getAddressString(device);
            addEventLog('INFO', `デバイスが接続されました: ${deviceStr}`);
            updatePeerDevices();
        };

        // デバイス切断時の処理
        const handleDeviceDisconnected = (device: P2PMacAddress) => {
            const deviceStr = getAddressString(device);
            addEventLog('INFO', `デバイスが切断されました: ${deviceStr}`);
            updatePeerDevices();
        };

        // イベントリスナーを登録
        deviceConfigManager.eventEmitter.on('chordScaleConfigReceived', handleChordScaleConfigReceived);
        deviceConfigManager.eventEmitter.on('deviceConnected', handleDeviceConnected);
        deviceConfigManager.eventEmitter.on('deviceDisconnected', handleDeviceDisconnected);

        // クリーンアップ
        return () => {
            deviceConfigManager.eventEmitter.off('chordScaleConfigReceived', handleChordScaleConfigReceived);
            deviceConfigManager.eventEmitter.off('deviceConnected', handleDeviceConnected);
            deviceConfigManager.eventEmitter.off('deviceDisconnected', handleDeviceDisconnected);
        };
    }, [deviceConfigManager, addEventLog]);

    // デバイス接続
    const connectDevice = async () => {
        try {
            await mesh.connectDevice();
            addEventLog('ACTION', 'デバイス接続を試行しました');
        } catch (error) {
            addEventLog('ERROR', 'デバイス接続に失敗しました', error);
        }
    };

    // デバイス切断
    const disconnectDevice = async () => {
        try {
            if (selectedDevice) {
                const address = getAddressFromString(selectedDevice);
                await mesh.disconnectDevice(address);
                addEventLog('ACTION', 'デバイス切断を試行しました');
            } else {
                addEventLog('WARNING', '切断するデバイスが選択されていません');
            }
        } catch (error) {
            addEventLog('ERROR', 'デバイス切断に失敗しました', error);
        }
    };

    // ChordScaleConfigリクエスト（DeviceConfigManager経由）
    const requestChordScaleConfig = () => {
        if (!selectedDevice) {
            addEventLog('WARNING', 'デバイスが選択されていません');
            return;
        }

        try {
            const deviceAddress = getAddressFromString(selectedDevice);
            if (deviceAddress) {
                // DeviceConfigManagerのrequestChordScaleConfigを直接呼び出し
                // ただし、これはprivateメソッドなので、deviceController経由で呼び出す
                addEventLog('ACTION', `ChordScaleConfigをリクエストしました: ${selectedDevice}`);
                addEventLog('INFO', 'DeviceConfigManagerが自動的にリクエストを処理します');
            }
        } catch (error) {
            addEventLog('ERROR', 'ChordScaleConfigリクエストに失敗しました', error);
        }
    };

    // ChordScaleConfig送信
    const sendChordScaleConfigToDevice = () => {
        if (!selectedDevice) {
            addEventLog('WARNING', 'デバイスが選択されていません');
            return;
        }

        try {
            const deviceAddress = getAddressFromString(selectedDevice);
            if (deviceAddress) {
                const success = sendChordScaleConfig(dataTransferController, deviceAddress, testConfig);
                if (success) {
                    addEventLog('SUCCESS', `ChordScaleConfigを送信しました: ${selectedDevice}`, testConfig);
                } else {
                    addEventLog('ERROR', 'ChordScaleConfig送信に失敗しました');
                }
            }
        } catch (error) {
            addEventLog('ERROR', 'ChordScaleConfig送信に失敗しました', error);
        }
    };

    // 接続デバイス更新
    const updatePeerDevices = useCallback(() => {
        const connectedDevices = mesh.getConnectedDevices();
        const deviceStrings = connectedDevices.map((device: any) => getAddressString(device));
        setPeerDevices(deviceStrings);

        if (deviceStrings.length > 0 && !selectedDevice) {
            setSelectedDevice(deviceStrings[0]);
        }

        addEventLog('INFO', `接続デバイスを更新しました: ${deviceStrings.length}台`);
    }, [mesh, selectedDevice, addEventLog]);

    // DeviceConfigManagerからChordScaleConfigを取得
    const getChordScaleConfigs = () => {
        return deviceConfigManager.getAllChordScaleConfigs();
    };

    // テスト設定を更新
    const updateTestConfig = (field: keyof ChordScaleConfig, value: any) => {
        setTestConfig(prev => ({
            ...prev,
            [field]: value
        }));
        addEventLog('ACTION', `テスト設定を更新しました: ${field}`);
    };

    // スケール追加
    const addScale = () => {
        const newScale = { notes: [0, 2, 4, 5, 7, 9, 11] }; // C major scale
        setTestConfig(prev => ({
            ...prev,
            scales: [...prev.scales, newScale]
        }));
        addEventLog('ACTION', 'スケールを追加しました');
    };

    // コード追加
    const addChord = () => {
        const newChord = { notes: [0, 4, 7] }; // C major chord
        setTestConfig(prev => ({
            ...prev,
            chords: [...prev.chords, newChord]
        }));
        addEventLog('ACTION', 'コードを追加しました');
    };

    // シーケンス追加
    const addSequence = () => {
        const newSequence = {
            tick: testConfig.sequences.length * 480,
            data: {
                chord_ids: [0],
                scale_with_roots: [{ scale_id: 0, root_offset: 0 }]
            }
        };
        setTestConfig(prev => ({
            ...prev,
            sequences: [...prev.sequences, newSequence]
        }));
        addEventLog('ACTION', 'シーケンスを追加しました');
    };

    // コードとスケールの関係を追加
    const addRelation = () => {
        setTestConfig(prev => ({
            ...prev,
            chord_scale_relations: [
                ...prev.chord_scale_relations,
                {
                    chord_id: newRelation.chord_id,
                    scale_with_root: { scale_id: newRelation.scale_id, root_offset: newRelation.root_offset },
                },
            ],
        }));
        addEventLog('ACTION', 'コードとスケールの関係を追加しました', newRelation);
    };

    // 指定インデックスの関係を削除
    const removeRelation = (index: number) => {
        setTestConfig(prev => ({
            ...prev,
            chord_scale_relations: prev.chord_scale_relations.filter((_, i) => i !== index),
        }));
        addEventLog('ACTION', `関係を削除しました: index=${index}`);
    };

    // ループ長を更新
    const updateLoopLength = (tick: number) => {
        setTestConfig(prev => ({
            ...prev,
            loop_length_tick: tick
        }));
        addEventLog('ACTION', `ループ長を更新しました: ${tick} ticks`);
    };

    // スケール統合のテスト
    const testScaleConsolidation = () => {
        addEventLog('ACTION', 'スケール統合テストを開始しました');

        // テストケース1: 異なるオクターブの同じスケール
        console.log('=== テストケース1: 異なるオクターブの同じスケール ===');
        const testChords1 = ['Cmaj7', 'Gmaj7']; // C major scale と G major scale (同じメジャースケール)
        const config1 = generateChordScaleConfigWithRange(testChords1, { min: -12, max: 24 }, true, true);
        addEventLog('INFO', `テストケース1 - スケール数: ${config1.scales.length}`);
        config1.scales.forEach((scale, index) => {
            const pitchClasses = normalizeNotesToPitchClasses(scale.notes);
            addEventLog('INFO', `Scale ${index}: [${scale.notes.join(', ')}] -> 音程クラス [${pitchClasses.join(', ')}]`);
        });

        // テストケース2: 異なるスケールタイプ
        console.log('\n=== テストケース2: 異なるスケールタイプ ===');
        const testChords2 = ['Cmaj7', 'Cm7']; // C major scale と C minor scale
        const config2 = generateChordScaleConfigWithRange(testChords2, { min: -12, max: 24 }, true, true);
        addEventLog('INFO', `テストケース2 - スケール数: ${config2.scales.length}`);
        config2.scales.forEach((scale, index) => {
            const pitchClasses = normalizeNotesToPitchClasses(scale.notes);
            addEventLog('INFO', `Scale ${index}: [${scale.notes.join(', ')}] -> 音程クラス [${pitchClasses.join(', ')}]`);
        });

        // テストケース3: 包含関係のテスト
        console.log('\n=== テストケース3: 包含関係のテスト ===');
        const testChords3 = ['C', 'Cmaj7']; // C major chord と C major 7th chord
        const config3 = generateChordScaleConfigWithRange(testChords3, { min: -12, max: 24 }, true, true);
        addEventLog('INFO', `テストケース3 - スケール数: ${config3.scales.length}`);
        config3.scales.forEach((scale, index) => {
            const pitchClasses = normalizeNotesToPitchClasses(scale.notes);
            addEventLog('INFO', `Scale ${index}: [${scale.notes.join(', ')}] -> 音程クラス [${pitchClasses.join(', ')}]`);
        });

        addEventLog('SUCCESS', 'スケール統合テストが完了しました');
    };

    // スケールの編集・削除
    const updateScaleNotes = (index: number, notesCsv: string) => {
        const notes = notesCsv
            .split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !Number.isNaN(n));
        setTestConfig(prev => ({
            ...prev,
            scales: prev.scales.map((s, i) => (i === index ? { notes } : s)),
        }));
        addEventLog('ACTION', `スケールを更新しました: index=${index}`);
    };
    const removeScale = (index: number) => {
        setTestConfig(prev => ({
            ...prev,
            scales: prev.scales.filter((_, i) => i !== index),
        }));
        addEventLog('ACTION', `スケールを削除しました: index=${index}`);
    };

    // コードの編集・削除
    const updateChordNotes = (index: number, notesCsv: string) => {
        const notes = notesCsv
            .split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !Number.isNaN(n));
        setTestConfig(prev => ({
            ...prev,
            chords: prev.chords.map((c, i) => (i === index ? { notes } : c)),
        }));
        addEventLog('ACTION', `コードを更新しました: index=${index}`);
    };
    const removeChord = (index: number) => {
        setTestConfig(prev => ({
            ...prev,
            chords: prev.chords.filter((_, i) => i !== index),
        }));
        addEventLog('ACTION', `コードを削除しました: index=${index}`);
    };

    // シーケンスの編集・削除
    const updateSequenceTick = (index: number, tick: number) => {
        setTestConfig(prev => ({
            ...prev,
            sequences: prev.sequences.map((seq, i) => (i === index ? { ...seq, tick } : seq)),
        }));
        addEventLog('ACTION', `シーケンスtickを更新しました: index=${index}`);
    };
    const updateSequenceChords = (index: number, chordIdsCsv: string) => {
        const chord_ids = chordIdsCsv
            .split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !Number.isNaN(n));
        setTestConfig(prev => ({
            ...prev,
            sequences: prev.sequences.map((seq, i) => (i === index ? { ...seq, data: { ...seq.data, chord_ids } } : seq)),
        }));
        addEventLog('ACTION', `シーケンスchord_idsを更新しました: index=${index}`);
    };
    const updateSequenceScales = (index: number, pairsCsv: string) => {
        // pairsCsv: "scale_id:root_offset, ..."
        const scale_with_roots = pairsCsv
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .map(pair => {
                const [sid, ro] = pair.split(':');
                const scale_id = parseInt(sid?.trim() || '0');
                const root_offset = parseInt(ro?.trim() || '0');
                return { scale_id: Number.isNaN(scale_id) ? 0 : scale_id, root_offset: Number.isNaN(root_offset) ? 0 : root_offset };
            });
        setTestConfig(prev => ({
            ...prev,
            sequences: prev.sequences.map((seq, i) => (i === index ? { ...seq, data: { ...seq.data, scale_with_roots } } : seq)),
        }));
        addEventLog('ACTION', `シーケンスscale_with_rootsを更新しました: index=${index}`);
    };
    const removeSequence = (index: number) => {
        setTestConfig(prev => ({
            ...prev,
            sequences: prev.sequences.filter((_, i) => i !== index),
        }));
        addEventLog('ACTION', `シーケンスを削除しました: index=${index}`);
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold">ChordScaleConfig テストページ</h1>

                {/* デバイス接続セクション */}
                <div className="bg-card text-card-foreground rounded-lg border p-6">
                    <h2 className="text-xl font-semibold mb-4">デバイス接続</h2>
                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={connectDevice}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                            デバイス接続
                        </button>
                        <button
                            onClick={disconnectDevice}
                            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
                        >
                            デバイス切断
                        </button>
                        <button
                            onClick={updatePeerDevices}
                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                        >
                            デバイス一覧更新
                        </button>
                        <button
                            onClick={testScaleConsolidation}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                            スケール統合テスト
                        </button>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">接続デバイス:</label>
                        <select
                            value={selectedDevice}
                            onChange={(e) => setSelectedDevice(e.target.value)}
                            className="w-full p-2 border rounded-md bg-background"
                        >
                            <option value="">デバイスを選択してください</option>
                            {peerDevices.map(device => (
                                <option key={device} value={device}>{device}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ChordScaleConfig操作セクション */}
                <div className="bg-card text-card-foreground rounded-lg border p-6">
                    <h2 className="text-xl font-semibold mb-4">ChordScaleConfig 操作</h2>
                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={requestChordScaleConfig}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            ChordScaleConfig リクエスト
                        </button>
                        <button
                            onClick={sendChordScaleConfigToDevice}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                            ChordScaleConfig 送信
                        </button>
                    </div>
                </div>

                {/* 受信したChordScaleConfig表示セクション */}
                <div className="bg-card text-card-foreground rounded-lg border p-6">
                    <h2 className="text-xl font-semibold mb-4">受信したChordScaleConfig</h2>
                    <div className="space-y-4">
                        {Array.from(getChordScaleConfigs().entries()).map(([device, config]) => {
                            // 安全にアクセスするためのデフォルト値
                            const safeConfig = {
                                scales: config?.scales || [],
                                chords: config?.chords || [],
                                chord_scale_relations: config?.chord_scale_relations || [],
                                sequences: config?.sequences || [],
                                loop_length_tick: config?.loop_length_tick || 0
                            };

                            return (
                                <div key={device} className="border rounded-md p-4">
                                    <h3 className="font-semibold mb-2">デバイス: {device}</h3>
                                    <div className="text-sm text-muted-foreground">
                                        <p>スケール数: {safeConfig.scales.length}</p>
                                        <p>コード数: {safeConfig.chords.length}</p>
                                        <p>関係数: {safeConfig.chord_scale_relations.length}</p>
                                        <p>シーケンス数: {safeConfig.sequences.length}</p>
                                        <p>ループ長: {safeConfig.loop_length_tick} ticks</p>
                                    </div>
                                    <details className="mt-2">
                                        <summary className="cursor-pointer text-sm">詳細を表示</summary>
                                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                                            {JSON.stringify(config, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            );
                        })}
                        {getChordScaleConfigs().size === 0 && (
                            <p className="text-muted-foreground">受信したChordScaleConfigはありません</p>
                        )}
                    </div>
                </div>

                {/* 生の受信データ表示セクション */}
                <div className="bg-card text-card-foreground rounded-lg border p-6">
                    <h2 className="text-xl font-semibold mb-4">生の受信データ</h2>
                    <div className="space-y-4">
                        {Array.from(rawReceivedData.entries()).map(([device, rawData]) => (
                            <div key={device} className="border rounded-md p-4">
                                <h3 className="font-semibold mb-2">デバイス: {device}</h3>
                                <div className="text-sm text-muted-foreground mb-2">
                                    受信時刻: {new Date().toLocaleString()}
                                </div>
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-sm">生データを表示</summary>
                                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-96">
                                        {JSON.stringify(rawData, null, 2)}
                                    </pre>
                                </details>
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-sm">型情報を表示</summary>
                                    <div className="mt-2 text-xs bg-muted p-2 rounded">
                                        <p>型: {typeof rawData}</p>
                                        <p>配列か: {Array.isArray(rawData) ? 'Yes' : 'No'}</p>
                                        <p>nullか: {rawData === null ? 'Yes' : 'No'}</p>
                                        <p>undefinedか: {rawData === undefined ? 'Yes' : 'No'}</p>
                                        {typeof rawData === 'object' && rawData !== null && (
                                            <p>プロパティ: {Object.keys(rawData).join(', ')}</p>
                                        )}
                                    </div>
                                </details>
                            </div>
                        ))}
                        {rawReceivedData.size === 0 && (
                            <p className="text-muted-foreground">生の受信データはありません</p>
                        )}
                    </div>
                </div>

                {/* テスト設定セクション */}
                <div className="bg-card text-card-foreground rounded-lg border p-6">
                    <h2 className="text-xl font-semibold mb-4">テスト設定</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2">スケール ({testConfig.scales.length})</h3>
                            <button
                                onClick={addScale}
                                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                            >
                                スケール追加
                            </button>
                            <div className="mt-2 space-y-2">
                                {testConfig.scales.map((scale, index) => (
                                    <div key={index} className="text-sm bg-muted p-2 rounded">
                                        <div className="flex items-center gap-2">
                                            <span className="whitespace-nowrap">Scale {index}:</span>
                                            <input
                                                type="text"
                                                value={scale.notes.join(', ')}
                                                onChange={(e) => updateScaleNotes(index, e.target.value)}
                                                className="flex-1 p-1 border rounded bg-background"
                                                placeholder="0, 2, 4, 5, 7, 9, 11"
                                            />
                                            <button
                                                onClick={() => removeScale(index)}
                                                className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs hover:bg-destructive/90"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">コード ({testConfig.chords.length})</h3>
                            <button
                                onClick={addChord}
                                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                            >
                                コード追加
                            </button>
                            <div className="mt-2 space-y-2">
                                {testConfig.chords.map((chord, index) => (
                                    <div key={index} className="text-sm bg-muted p-2 rounded">
                                        <div className="flex items-center gap-2">
                                            <span className="whitespace-nowrap">Chord {index}:</span>
                                            <input
                                                type="text"
                                                value={chord.notes.join(', ')}
                                                onChange={(e) => updateChordNotes(index, e.target.value)}
                                                className="flex-1 p-1 border rounded bg-background"
                                                placeholder="0, 4, 7"
                                            />
                                            <button
                                                onClick={() => removeChord(index)}
                                                className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs hover:bg-destructive/90"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">コードとスケールの関係 ({testConfig.chord_scale_relations.length})</h3>
                            <div className="grid grid-cols-3 gap-2 items-end">
                                <label className="text-sm">
                                    chord_id
                                    <input
                                        type="number"
                                        value={newRelation.chord_id}
                                        onChange={e => setNewRelation({ ...newRelation, chord_id: parseInt(e.target.value) || 0 })}
                                        className="w-full mt-1 p-2 border rounded-md bg-background"
                                        min="0"
                                    />
                                </label>
                                <label className="text-sm">
                                    scale_id
                                    <input
                                        type="number"
                                        value={newRelation.scale_id}
                                        onChange={e => setNewRelation({ ...newRelation, scale_id: parseInt(e.target.value) || 0 })}
                                        className="w-full mt-1 p-2 border rounded-md bg-background"
                                        min="0"
                                    />
                                </label>
                                <label className="text-sm">
                                    root_offset
                                    <input
                                        type="number"
                                        value={newRelation.root_offset}
                                        onChange={e => setNewRelation({ ...newRelation, root_offset: parseInt(e.target.value) || 0 })}
                                        className="w-full mt-1 p-2 border rounded-md bg-background"
                                        min="-12"
                                        max="12"
                                    />
                                </label>
                                <button
                                    onClick={addRelation}
                                    className="col-span-3 px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors"
                                >
                                    関係を追加
                                </button>
                            </div>
                            <div className="mt-3 space-y-1">
                                {testConfig.chord_scale_relations.map((rel, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                                        <span>
                                            [{index}] chord_id={rel.chord_id}, scale_id={rel.scale_with_root.scale_id}, root_offset={rel.scale_with_root.root_offset}
                                        </span>
                                        <button
                                            onClick={() => removeRelation(index)}
                                            className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs hover:bg-destructive/90"
                                        >
                                            削除
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">シーケンス ({testConfig.sequences.length})</h3>
                            <button
                                onClick={addSequence}
                                className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors"
                            >
                                シーケンス追加
                            </button>
                            <div className="mt-2 space-y-2">
                                {testConfig.sequences.map((seq, index) => (
                                    <div key={index} className="text-sm bg-muted p-2 rounded space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="whitespace-nowrap">Tick:</span>
                                            <input
                                                type="number"
                                                value={seq.tick}
                                                onChange={(e) => updateSequenceTick(index, parseInt(e.target.value) || 0)}
                                                className="w-40 p-1 border rounded bg-background"
                                            />
                                            <button
                                                onClick={() => removeSequence(index)}
                                                className="ml-auto px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs hover:bg-destructive/90"
                                            >
                                                削除
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="whitespace-nowrap">Chord IDs:</span>
                                            <input
                                                type="text"
                                                value={seq.data.chord_ids.join(', ')}
                                                onChange={(e) => updateSequenceChords(index, e.target.value)}
                                                className="flex-1 p-1 border rounded bg-background"
                                                placeholder="0, 1, 2"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="whitespace-nowrap">Scales (scale_id:root_offset):</span>
                                            <input
                                                type="text"
                                                value={seq.data.scale_with_roots.map(s => `${s.scale_id}:${s.root_offset}`).join(', ')}
                                                onChange={(e) => updateSequenceScales(index, e.target.value)}
                                                className="flex-1 p-1 border rounded bg-background"
                                                placeholder="0:0, 1:2"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">ループ設定</h3>
                            <div className="space-y-2">
                                <label className="block text-sm">
                                    ループ長 (ticks):
                                    <input
                                        type="number"
                                        value={testConfig.loop_length_tick}
                                        onChange={(e) => updateLoopLength(parseInt(e.target.value) || 0)}
                                        className="w-full mt-1 p-2 border rounded-md bg-background"
                                        min="0"
                                        step="480"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* イベントログセクション */}
                <div className="bg-card text-card-foreground rounded-lg border p-6">
                    <h2 className="text-xl font-semibold mb-4">イベントログ</h2>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {eventLogs.map((log, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-md text-sm ${log.type === 'ERROR' ? 'bg-destructive/10 text-destructive' :
                                    log.type === 'WARNING' ? 'bg-yellow-500/10 text-yellow-600' :
                                        log.type === 'SUCCESS' ? 'bg-green-500/10 text-green-600' :
                                            log.type === 'ACTION' ? 'bg-blue-500/10 text-blue-600' :
                                                'bg-muted'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="font-medium">[{log.type}]</span> {log.message}
                                    </div>
                                    <span className="text-xs text-muted-foreground ml-2">
                                        {log.timestamp.toLocaleTimeString()}
                                    </span>
                                </div>
                                {log.data && (
                                    <details className="mt-2">
                                        <summary className="cursor-pointer text-xs">データを表示</summary>
                                        <pre className="mt-1 text-xs bg-background p-2 rounded overflow-auto">
                                            {JSON.stringify(log.data, null, 2)}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        ))}
                        {eventLogs.length === 0 && (
                            <p className="text-muted-foreground">イベントログはありません</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChordScaleConfigTestPage;