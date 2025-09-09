'use client';

import React, { useState, useCallback } from 'react';
import { useSynthevery } from '@/contexts/SyntheveryContext';
import { getAddressFromString, getAddressString } from '@/lib/synthevery-core/connection/util';
import { sendChordScaleConfig } from '@/lib/synthevery-core/device/config';
import { ChordScaleConfig } from '@/types/chordScale';
import { P2PMacAddress } from '@/lib/synthevery-core/types/mesh';
import { generateChordScaleConfigWithRange } from '@/lib/utils/tonal-chordscale';

interface EventLog {
    timestamp: Date;
    type: string;
    message: string;
    data?: any;
}

interface GeneratedData {
    config: ChordScaleConfig;
    chordNames: string[];
    scaleNames: string[];
}

const SimpleChordScaleBuilder: React.FC = () => {
    const { mesh, deviceConfigManager, dataTransferController } = useSynthevery();
    const [peerDevices, setPeerDevices] = useState<string[]>([]);
    const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string>('');

    // メインの状態
    const [chordList, setChordList] = useState<string>('Cmaj, Am, F, G');
    const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // 範囲指定オプション
    const [noteRange, setNoteRange] = useState({ min: -12, max: 24 });
    const [useVoicingAlgorithm, setUseVoicingAlgorithm] = useState(true);
    const [consolidateScales, setConsolidateScales] = useState(true);

    // イベントログを追加する関数
    const addEventLog = useCallback((type: string, message: string, data?: any) => {
        const newLog: EventLog = {
            timestamp: new Date(),
            type,
            message,
            data
        };
        setEventLogs(prev => [newLog, ...prev.slice(0, 49)]);
    }, []);

    // DeviceConfigManagerのイベントリスナーを設定
    React.useEffect(() => {
        const handleChordScaleConfigReceived = (device: P2PMacAddress, config: ChordScaleConfig) => {
            const deviceStr = getAddressString(device);
            addEventLog('SUCCESS', `ChordScaleConfigを受信しました: ${deviceStr}`, config);
        };

        const handleDeviceConnected = (device: P2PMacAddress) => {
            const deviceStr = getAddressString(device);
            addEventLog('INFO', `デバイスが接続されました: ${deviceStr}`);
            updatePeerDevices();
        };

        const handleDeviceDisconnected = (device: P2PMacAddress) => {
            const deviceStr = getAddressString(device);
            addEventLog('INFO', `デバイスが切断されました: ${deviceStr}`);
            updatePeerDevices();
        };

        deviceConfigManager.eventEmitter.on('chordScaleConfigReceived', handleChordScaleConfigReceived);
        deviceConfigManager.eventEmitter.on('deviceConnected', handleDeviceConnected);
        deviceConfigManager.eventEmitter.on('deviceDisconnected', handleDeviceDisconnected);

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
            await mesh.disconnectDevice();
            addEventLog('ACTION', 'デバイス切断を試行しました');
        } catch (error) {
            addEventLog('ERROR', 'デバイス切断に失敗しました', error);
        }
    };

    // ChordScaleConfig送信
    const sendChordScaleConfigToDevice = () => {
        if (!selectedDevice || !generatedData) {
            addEventLog('WARNING', 'デバイスまたは生成データが選択されていません');
            return;
        }

        try {
            const deviceAddress = getAddressFromString(selectedDevice);
            if (deviceAddress) {
                const success = sendChordScaleConfig(dataTransferController, deviceAddress, generatedData.config);
                if (success) {
                    addEventLog('SUCCESS', `ChordScaleConfigを送信しました: ${selectedDevice}`, generatedData.config);
                } else {
                    addEventLog('ERROR', 'ChordScaleConfig送信に失敗しました');
                }
            }
        } catch (error) {
            addEventLog('ERROR', 'ChordScaleConfig送信に失敗しました', error);
        }
    };

    // 接続デバイス更新
    const updatePeerDevices = () => {
        const connectedDevices = mesh.getConnectedDevices();
        const deviceStrings = connectedDevices.map((device: any) => getAddressString(device));
        setPeerDevices(deviceStrings);

        if (deviceStrings.length > 0 && !selectedDevice) {
            setSelectedDevice(deviceStrings[0]);
        }

        addEventLog('INFO', `接続デバイスを更新しました: ${deviceStrings.length}台`);
    };

    // コードリストから自動生成
    const generateFromChordList = useCallback(async () => {
        if (!chordList.trim()) {
            addEventLog('WARNING', 'コードリストが入力されていません');
            return;
        }

        setIsGenerating(true);

        try {
            // コードリストをパース
            const chordNames = chordList
                .split(',')
                .map(name => name.trim())
                .filter(name => name.length > 0);

            if (chordNames.length === 0) {
                addEventLog('WARNING', '有効なコード名が見つかりません');
                return;
            }

            addEventLog('ACTION', `コードリストから生成開始: ${chordNames.join(', ')}`);

            // ChordScaleConfigを自動生成（範囲指定オプション付き）
            const config = generateChordScaleConfigWithRange(chordNames, noteRange, useVoicingAlgorithm, consolidateScales);

            // 生成されたスケール名を取得
            const scaleNames = config.scales.map((_, index) => {
                // 各スケールに対応するスケール名を推測
                const chordIndex = config.chord_scale_relations.findIndex(rel => rel.scale_with_root.scale_id === index);
                if (chordIndex >= 0) {
                    const chordName = chordNames[chordIndex];
                    return `${chordName} scale`;
                }
                return `Scale ${index}`;
            });

            const data: GeneratedData = {
                config,
                chordNames,
                scaleNames
            };

            setGeneratedData(data);
            addEventLog('SUCCESS', 'ChordScaleConfigを自動生成しました', {
                chords: chordNames.length,
                scales: config.scales.length,
                relations: config.chord_scale_relations.length
            });

        } catch (error) {
            addEventLog('ERROR', `生成中にエラーが発生しました: ${error}`);
        } finally {
            setIsGenerating(false);
        }
    }, [chordList, noteRange, useVoicingAlgorithm, consolidateScales, addEventLog]);

    // シーケンス更新
    const updateSequence = useCallback((sequenceIndex: number, field: 'tick' | 'chordIds' | 'scaleIds', value: any) => {
        if (!generatedData) return;

        const newConfig = { ...generatedData.config };
        const sequence = newConfig.sequences[sequenceIndex];

        if (field === 'tick') {
            sequence.tick = parseInt(value) || 0;
        } else if (field === 'chordIds') {
            const chordIds = value.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id));
            sequence.data.chord_ids = chordIds;
        } else if (field === 'scaleIds') {
            const scaleIds = value.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id));
            sequence.data.scale_with_roots = scaleIds.map(scaleId => ({
                scale_id: scaleId,
                root_offset: 0
            }));
        }

        setGeneratedData({ ...generatedData, config: newConfig });
        addEventLog('ACTION', `シーケンス ${sequenceIndex} を更新しました`);
    }, [generatedData, addEventLog]);

    // シーケンス追加
    const addSequence = useCallback(() => {
        if (!generatedData) return;

        const newConfig = { ...generatedData.config };
        const newTick = newConfig.sequences.length > 0
            ? Math.max(...newConfig.sequences.map(s => s.tick)) + 480
            : 0;

        newConfig.sequences.push({
            tick: newTick,
            data: {
                chord_ids: [0],
                scale_with_roots: [{ scale_id: 0, root_offset: 0 }]
            }
        });

        setGeneratedData({ ...generatedData, config: newConfig });
        addEventLog('ACTION', 'シーケンスを追加しました');
    }, [generatedData, addEventLog]);

    // シーケンス削除
    const removeSequence = useCallback((index: number) => {
        if (!generatedData) return;

        const newConfig = { ...generatedData.config };
        newConfig.sequences.splice(index, 1);
        setGeneratedData({ ...generatedData, config: newConfig });
        addEventLog('ACTION', `シーケンス ${index} を削除しました`);
    }, [generatedData, addEventLog]);

    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold">Simple ChordScale Builder</h1>

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

                {/* コードリスト入力セクション */}
                <div className="bg-card text-card-foreground rounded-lg border p-6">
                    <h2 className="text-xl font-semibold mb-4">コードリスト入力</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                コード名をカンマ区切りで入力してください
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={chordList}
                                    onChange={(e) => setChordList(e.target.value)}
                                    placeholder="例: Cmaj, Am, F, G, Dm, Em"
                                    className="flex-1 p-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    disabled={isGenerating}
                                />
                                <button
                                    onClick={generateFromChordList}
                                    disabled={isGenerating || !chordList.trim()}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? '生成中...' : '自動生成'}
                                </button>
                            </div>
                        </div>

                        {/* 範囲指定オプション */}
                        <div className="border-t pt-4">
                            <h3 className="text-lg font-medium mb-3">範囲指定オプション</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">ノート番号範囲</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="number"
                                            value={noteRange.min}
                                            onChange={(e) => setNoteRange(prev => ({ ...prev, min: parseInt(e.target.value) || -12 }))}
                                            className="w-20 p-2 border rounded-md bg-background"
                                            min="-24"
                                            max="12"
                                        />
                                        <span className="text-sm text-muted-foreground">〜</span>
                                        <input
                                            type="number"
                                            value={noteRange.max}
                                            onChange={(e) => setNoteRange(prev => ({ ...prev, max: parseInt(e.target.value) || 24 }))}
                                            className="w-20 p-2 border rounded-md bg-background"
                                            min="0"
                                            max="48"
                                        />
                                        <span className="text-sm text-muted-foreground">
                                            (C4基準: {60 + noteRange.min}〜{60 + noteRange.max})
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">アルゴリズム選択</label>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="useVoicingAlgorithm"
                                                checked={useVoicingAlgorithm}
                                                onChange={(e) => setUseVoicingAlgorithm(e.target.checked)}
                                                className="rounded"
                                            />
                                            <label htmlFor="useVoicingAlgorithm" className="text-sm">
                                                最適ヴォイシングアルゴリズムを使用
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="consolidateScales"
                                                checked={consolidateScales}
                                                onChange={(e) => setConsolidateScales(e.target.checked)}
                                                className="rounded"
                                            />
                                            <label htmlFor="consolidateScales" className="text-sm">
                                                スケール統合を有効化
                                            </label>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {useVoicingAlgorithm ?
                                            '転回形とオクターブ調整で最適なヴォイシングを生成' :
                                            '従来の積み上げ方式を使用'
                                        }
                                        <br />
                                        {consolidateScales ?
                                            '類似するスケールを統合して効率化' :
                                            '各コードに個別のスケールを割り当て'
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* プリセットボタン */}
                            <div className="mt-3">
                                <label className="block text-sm font-medium mb-2">プリセット</label>
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => setNoteRange({ min: -12, max: 24 })}
                                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                                    >
                                        標準範囲 (-12〜24)
                                    </button>
                                    <button
                                        onClick={() => setNoteRange({ min: 0, max: 12 })}
                                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                                    >
                                        1オクターブ (0〜12)
                                    </button>
                                    <button
                                        onClick={() => setNoteRange({ min: -6, max: 18 })}
                                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                                    >
                                        2オクターブ (-6〜18)
                                    </button>
                                    <button
                                        onClick={() => setNoteRange({ min: -24, max: 36 })}
                                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                                    >
                                        広範囲 (-24〜36)
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            <p>対応するコード名の例:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>メジャーコード: C, Cmaj, CM, C major</li>
                                <li>マイナーコード: Am, A minor, Am7</li>
                                <li>セブンスコード: C7, Cmaj7, Am7, G7</li>
                                <li>その他: Csus4, Cadd9, Cdim, Caug</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 生成結果表示セクション */}
                {generatedData && (
                    <div className="bg-card text-card-foreground rounded-lg border p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">生成結果</h2>
                            <button
                                onClick={sendChordScaleConfigToDevice}
                                disabled={!selectedDevice}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                デバイスに送信
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* コード一覧 */}
                            <div>
                                <h3 className="font-semibold mb-2">生成されたコード ({generatedData.chordNames.length})</h3>
                                <div className="space-y-1">
                                    {generatedData.chordNames.map((name, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                            <span>{index}: {name}</span>
                                            <span className="text-sm text-muted-foreground">
                                                [{generatedData.config.chords[index]?.notes.join(', ')}]
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* スケール一覧 */}
                            <div>
                                <h3 className="font-semibold mb-2">生成されたスケール ({generatedData.scaleNames.length})</h3>
                                <div className="space-y-1">
                                    {generatedData.scaleNames.map((name, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                            <span>{index}: {name}</span>
                                            <span className="text-sm text-muted-foreground">
                                                [{generatedData.config.scales[index]?.notes.join(', ')}]
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* シーケンスエディタ */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold">シーケンス設定 ({generatedData.config.sequences.length})</h3>
                                <button
                                    onClick={addSequence}
                                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                                >
                                    シーケンス追加
                                </button>
                            </div>

                            <div className="space-y-3">
                                {generatedData.config.sequences.map((sequence, index) => (
                                    <div key={index} className="border rounded-md p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-medium">シーケンス {index + 1}</h4>
                                            <button
                                                onClick={() => removeSequence(index)}
                                                className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                                            >
                                                削除
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Tick</label>
                                                <input
                                                    type="number"
                                                    value={sequence.tick}
                                                    onChange={(e) => updateSequence(index, 'tick', e.target.value)}
                                                    className="w-full p-2 border rounded-md bg-background"
                                                    min="0"
                                                    step="480"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-1">Chord IDs</label>
                                                <input
                                                    type="text"
                                                    value={sequence.data.chord_ids.join(', ')}
                                                    onChange={(e) => updateSequence(index, 'chordIds', e.target.value)}
                                                    className="w-full p-2 border rounded-md bg-background"
                                                    placeholder="0, 1, 2"
                                                />
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    利用可能: 0-{generatedData.config.chords.length - 1}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-1">Scale IDs</label>
                                                <input
                                                    type="text"
                                                    value={sequence.data.scale_with_roots.map(s => s.scale_id).join(', ')}
                                                    onChange={(e) => updateSequence(index, 'scaleIds', e.target.value)}
                                                    className="w-full p-2 border rounded-md bg-background"
                                                    placeholder="0, 1"
                                                />
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    利用可能: 0-{generatedData.config.scales.length - 1}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ループ長設定 */}
                            <div className="mt-4 pt-4 border-t">
                                <label className="block text-sm font-medium mb-2">ループ長 (ticks)</label>
                                <input
                                    type="number"
                                    value={generatedData.config.loop_length_tick}
                                    onChange={(e) => {
                                        const newConfig = {
                                            ...generatedData.config,
                                            loop_length_tick: parseInt(e.target.value) || 0
                                        };
                                        setGeneratedData({ ...generatedData, config: newConfig });
                                    }}
                                    className="w-full p-2 border rounded-md bg-background"
                                    min="0"
                                    step="480"
                                />
                            </div>
                        </div>
                    </div>
                )}

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

export default SimpleChordScaleBuilder;