'use client';

import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useSynthevery } from '@/contexts/SyntheveryContext';
import { getAddressFromString, getAddressString } from '@/lib/synthevery-core/connection/util';
import { sendChordScaleConfig } from '@/lib/synthevery-core/device/config';
import { ChordScaleConfig } from '@/types/chordScale';
import { P2PMacAddress } from '@/lib/synthevery-core/types/mesh';
import { generateChordScaleConfigWithRange, generateScalesFromChords } from '@/lib/utils/tonal-chordscale';
import ChordProgressionPreview from '@/components/ChordProgressionPreview';

interface EventLog {
    timestamp: Date;
    type: string;
    message: string;
    data?: any;
}

// Pydantic風のスキーマ定義（型安全性向上）
interface ChordTimelineItem {
    chord_name: string;
    duration_beats: number;
}

interface ChordProgressionMetadata {
    key: string;
    time_signature: string;
    total_beats: number;
}

interface GeneratedChordProgression {
    pattern_id: number;
    metadata: ChordProgressionMetadata;
    timeline: ChordTimelineItem[];
}

interface AIResponse {
    chord_progressions: GeneratedChordProgression[];
}

// バリデーション関数
const validateChordProgression = (progression: any): GeneratedChordProgression | null => {
    try {
        // 必須フィールドのチェック
        if (!progression.pattern_id || !progression.metadata || !progression.timeline) {
            return null;
        }

        // メタデータのバリデーション
        const { key, time_signature, total_beats } = progression.metadata;
        if (!key || !time_signature || !total_beats) {
            return null;
        }

        // 拍子記号の有効性チェック
        const validTimeSignatures = ["4/4", "3/4", "2/4", "6/8"];
        if (!validTimeSignatures.includes(time_signature)) {
            return null;
        }

        // 拍数の範囲チェック
        if (total_beats < 4 || total_beats > 64) {
            return null;
        }

        // タイムラインのバリデーション
        if (!Array.isArray(progression.timeline) || progression.timeline.length === 0) {
            return null;
        }

        // 各タイムラインアイテムのバリデーション
        for (const item of progression.timeline) {
            if (!item.chord_name || typeof item.chord_name !== 'string') {
                return null;
            }
            if (!item.duration_beats || item.duration_beats < 1 || item.duration_beats > 16) {
                return null;
            }
        }

        return progression as GeneratedChordProgression;
    } catch (error) {
        return null;
    }
};

interface GeneratedData {
    config: ChordScaleConfig;
    chordNames: string[];
    scaleNames: string[];
    aiResponse: AIResponse;
}

const AIChordGenerationPage: React.FC = () => {
    const { mesh, deviceConfigManager, dataTransferController } = useSynthevery();
    const [peerDevices, setPeerDevices] = useState<string[]>([]);
    const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string>('');

    // AI生成の状態
    const [prompt, setPrompt] = useState(`# Role
あなたは、多様な音楽ジャンルに精通し、Tonal.jsの仕様も理解している作曲AIアシスタントです。

# Context
これから生成するコード進行は、ループ再生して使用する「モーション演奏デバイス」のためのものです。
このJSONは、ループの中で「どの時間帯にどのコードが有効か」という時間割（タイムライン）を定義します。
実際の音の長さ（発音長）はデバイス側で決定されるため、休符を考慮する必要はなく、タイムラインは常に途切れなく連続します。

# Request
以下の \`# Conditions\` に基づいて、コード進行のアイデアを5パターン生成してください。

# Conditions
[GENRE]: Jazz Fusion
[MOOD]: 浮遊感, お洒落
[KEY]: C
[TIME_SIGNATURE]: 4/4
[LOOP_BARS]: 4

# Output Format & Rules
- 出力は、単一の有効なJSONオブジェクトのみとしてください。JSONブロックの前後に説明や余分なテキストは含めないでください。
- **\`chord_name\`の値は、必ずTonal.jsライブラリで解釈可能な標準的な英語表記にしてください。(例: \`Cmaj7\`, \`G7b9\`, \`F#m7b5\`, \`C/E\`)**
- \`metadata\`内の\`total_beats\`は、\`[LOOP_BARS]\`と\`[TIME_SIGNATURE]\`から計算してください。(例: 4/4拍子で4小節なら 4 * 4 = 16拍)
- \`timeline\`配列内の各\`duration_beats\`の合計値は、必ず\`metadata\`内の\`total_beats\`と一致させてください。
- 以下のJSON構造を厳密に守ってください。

\`\`\`json
{
  "chord_progressions": [
    {
      "pattern_id": 1,
      "metadata": {
        "key": "C",
        "time_signature": "4/4",
        "total_beats": 16
      },
      "timeline": [
        { "chord_name": "Cmaj9", "duration_beats": 4 },
        { "chord_name": "Fmaj7#11", "duration_beats": 4 },
        { "chord_name": "Em7", "duration_beats": 4 },
        { "chord_name": "A7b13", "duration_beats": 4 }
      ]
    },
    {
      "pattern_id": 2,
      "metadata": {
        "key": "C",
        "time_signature": "4/4",
        "total_beats": 16
      },
      "timeline": [
        { "chord_name": "Dm9", "duration_beats": 4 },
        { "chord_name": "G13", "duration_beats": 4 },
        { "chord_name": "Cmaj7", "duration_beats": 4 },
        { "chord_name": "Ab7sus4", "duration_beats": 4 }
      ]
    },
    {
      "pattern_id": 3,
      "metadata": {
        "key": "C",
        "time_signature": "4/4",
        "total_beats": 16
      },
      "timeline": [
        { "chord_name": "Cmaj7/E", "duration_beats": 4 },
        { "chord_name": "Fm6", "duration_beats": 4 },
        { "chord_name": "Cmaj7", "duration_beats": 4 },
        { "chord_name": "G7b9", "duration_beats": 4 }
      ]
    },
    {
      "pattern_id": 4,
      "metadata": {
        "key": "C",
        "time_signature": "4/4",
        "total_beats": 16
      },
      "timeline": [
        { "chord_name": "Dbmaj7", "duration_beats": 4 },
        { "chord_name": "Gbmaj7", "duration_beats": 4 },
        { "chord_name": "Bmaj7", "duration_beats": 4 },
        { "chord_name": "Emaj7", "duration_beats": 4 }
      ]
    },
    {
      "pattern_id": 5,
      "metadata": {
        "key": "C",
        "time_signature": "4/4",
        "total_beats": 16
      },
      "timeline": [
        { "chord_name": "Am7", "duration_beats": 4 },
        { "chord_name": "D7", "duration_beats": 4 },
        { "chord_name": "Gmaj7", "duration_beats": 4 },
        { "chord_name": "Cmaj7", "duration_beats": 4 }
      ]
    }
  ]
}
\`\`\``);

    const [selectedPattern, setSelectedPattern] = useState<number>(0);
    const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // 範囲指定オプション
    const [noteRange, setNoteRange] = useState({ min: -12, max: 24 });
    const [useVoicingAlgorithm, setUseVoicingAlgorithm] = useState(true);
    const [consolidateScales, setConsolidateScales] = useState(true);

    // プレビュー機能の状態
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

    // Gemini API設定 - 環境変数から取得
    const [apiKey, setApiKey] = useState<string>(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

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

    // フォールバック機能: 構造化出力が失敗した場合の代替処理
    const generateFallbackChordProgressions = useCallback(async (ai: any, prompt: string): Promise<AIResponse | null> => {
        try {
            addEventLog('ACTION', 'フォールバック処理: 簡易プロンプトで再試行');

            // より簡潔なプロンプトで再試行
            const fallbackPrompt = `以下のJSON形式でコード進行を3つ生成してください。各コードは4拍で、4小節のループです。

{
  "chord_progressions": [
    {
      "pattern_id": 1,
      "metadata": {
        "key": "C",
        "time_signature": "4/4",
        "total_beats": 16
      },
      "timeline": [
        { "chord_name": "Cmaj7", "duration_beats": 4 },
        { "chord_name": "Am7", "duration_beats": 4 },
        { "chord_name": "Fmaj7", "duration_beats": 4 },
        { "chord_name": "G7", "duration_beats": 4 }
      ]
    }
  ]
}`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: fallbackPrompt,
                config: {
                    thinkingConfig: {
                        thinkingBudget: 0,
                    },
                }
            });

            if (response.text) {
                const parsed = JSON.parse(response.text);
                return parsed;
            }
        } catch (error) {
            addEventLog('ERROR', 'フォールバック処理でエラーが発生しました', error);
        }
        return null;
    }, [addEventLog]);

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
    }, [deviceConfigManager, addEventLog, updatePeerDevices]);

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
                const deviceAddress = getAddressFromString(selectedDevice);
                if (deviceAddress) {
                    await mesh.disconnectDevice(deviceAddress);
                    addEventLog('ACTION', 'デバイス切断を試行しました');
                } else {
                    addEventLog('WARNING', '選択されたデバイスのアドレスが無効です');
                }
            } else {
                addEventLog('WARNING', '切断するデバイスが選択されていません');
            }
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


    // AIコード進行生成
    const generateChordProgressions = useCallback(async () => {
        if (!prompt.trim()) {
            addEventLog('WARNING', 'プロンプトが入力されていません');
            return;
        }

        if (!apiKey.trim()) {
            addEventLog('WARNING', 'Gemini APIキーが設定されていません');
            return;
        }

        setIsGenerating(true);

        try {
            addEventLog('ACTION', 'AIコード進行生成を開始しました');

            // Gemini APIクライアントを初期化
            const ai = new GoogleGenAI({ apiKey });

            // 構造化出力スキーマを定義
            const responseSchema = {
                type: "object",
                properties: {
                    chord_progressions: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                pattern_id: {
                                    type: "integer"
                                },
                                metadata: {
                                    type: "object",
                                    properties: {
                                        key: {
                                            type: "string"
                                        },
                                        time_signature: {
                                            type: "string"
                                        },
                                        total_beats: {
                                            type: "integer"
                                        }
                                    },
                                    required: ["key", "time_signature", "total_beats"]
                                },
                                timeline: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            chord_name: {
                                                type: "string"
                                            },
                                            duration_beats: {
                                                type: "integer"
                                            }
                                        },
                                        required: ["chord_name", "duration_beats"]
                                    }
                                }
                            },
                            required: ["pattern_id", "metadata", "timeline"]
                        }
                    }
                },
                required: ["chord_progressions"]
            };

            // AIにリクエストを送信（構造化出力を使用）
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                    thinkingConfig: {
                        thinkingBudget: 0, // 思考機能を無効化してスピードを優先
                    },
                }
            });

            if (!response.text) {
                addEventLog('ERROR', 'AIからの応答が空でした');
                return;
            }

            addEventLog('SUCCESS', 'AIからコード進行を取得しました');

            // JSONをパース（構造化出力により安全）
            let aiResponse: AIResponse;
            try {
                aiResponse = JSON.parse(response.text);
            } catch (parseError) {
                addEventLog('ERROR', `JSONの解析に失敗しました: ${parseError}`);
                addEventLog('DEBUG', 'AI応答内容', response.text);

                // フォールバック: 構造化出力が失敗した場合の代替処理
                addEventLog('ACTION', 'フォールバック処理を実行します');
                const fallbackResponse = await generateFallbackChordProgressions(ai, prompt);
                if (fallbackResponse) {
                    aiResponse = fallbackResponse;
                    addEventLog('SUCCESS', 'フォールバック処理でコード進行を生成しました');
                } else {
                    addEventLog('ERROR', 'フォールバック処理も失敗しました');
                    return;
                }
            }

            if (!aiResponse.chord_progressions || aiResponse.chord_progressions.length === 0) {
                addEventLog('ERROR', 'コード進行データが見つかりませんでした');
                return;
            }

            // バリデーション: 各コード進行を検証
            const validatedProgressions: GeneratedChordProgression[] = [];
            for (let i = 0; i < aiResponse.chord_progressions.length; i++) {
                const progression = aiResponse.chord_progressions[i];
                const validated = validateChordProgression(progression);
                if (validated) {
                    validatedProgressions.push(validated);
                } else {
                    addEventLog('WARNING', `パターン ${i + 1} のバリデーションに失敗しました`, progression);
                }
            }

            if (validatedProgressions.length === 0) {
                addEventLog('ERROR', '有効なコード進行が見つかりませんでした');
                return;
            }

            addEventLog('SUCCESS', `${validatedProgressions.length}個のコード進行をバリデーションしました`);

            // 最初のパターンを選択
            const selectedProgression = validatedProgressions[selectedPattern];
            if (!selectedProgression) {
                addEventLog('ERROR', `選択されたパターン ${selectedPattern} が見つかりません`);
                return;
            }

            // コード名を抽出
            const chordNames = selectedProgression.timeline.map(item => item.chord_name);

            addEventLog('ACTION', `コードリストから生成開始: ${chordNames.join(', ')}`);

            // ChordScaleConfigを自動生成（範囲指定オプション付き）
            const config = generateChordScaleConfigWithRange(chordNames, noteRange, useVoicingAlgorithm, consolidateScales);

            // 生成されたスケール名を取得（実際のスケール名を使用）
            const scaleNames = config.scales.map((_, index) => {
                // 実際に生成されたスケール名を取得
                const generatedScaleNames = generateScalesFromChords(chordNames);
                if (generatedScaleNames.length > 0 && index === 0) {
                    return generatedScaleNames[0]; // 例: "C major", "D dorian"
                }
                return `Scale ${index}`;
            });

            const data: GeneratedData = {
                config,
                chordNames,
                scaleNames,
                aiResponse: { chord_progressions: validatedProgressions }
            };

            setGeneratedData(data);
            addEventLog('SUCCESS', 'AIコード進行からChordScaleConfigを生成しました', {
                patterns: validatedProgressions.length,
                selectedPattern: selectedPattern,
                chords: chordNames.length,
                scales: config.scales.length,
                relations: config.chord_scale_relations.length
            });

        } catch (error) {
            addEventLog('ERROR', `AIコード進行生成中にエラーが発生しました: ${error}`);
        } finally {
            setIsGenerating(false);
        }
    }, [prompt, apiKey, selectedPattern, noteRange, useVoicingAlgorithm, consolidateScales, addEventLog, generateFallbackChordProgressions]);

    // シーケンス更新
    const updateSequence = useCallback((sequenceIndex: number, field: 'tick' | 'chordIds' | 'scaleIds', value: string) => {
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
            sequence.data.scale_with_roots = scaleIds.map((scaleId: number) => ({
                scale_id: scaleId,
                root_offset: 0
            }));
        }

        setGeneratedData({ ...generatedData, config: newConfig });
        addEventLog('ACTION', `シーケンス ${sequenceIndex} を更新しました`);
    }, [generatedData, addEventLog]);

    // パターン選択時にデータを再生成する関数
    const updateGeneratedDataForPattern = useCallback((patternIndex: number, chordProgressions: GeneratedChordProgression[]) => {
        if (!generatedData || patternIndex >= chordProgressions.length) {
            addEventLog('WARNING', '無効なパターンインデックスです');
            return;
        }

        try {
            const selectedProgression = chordProgressions[patternIndex];
            if (!selectedProgression) {
                addEventLog('ERROR', `パターン ${patternIndex} が見つかりません`);
                return;
            }

            // コード名を抽出
            const chordNames = selectedProgression.timeline.map(item => item.chord_name);
            addEventLog('ACTION', `パターン ${patternIndex + 1} を選択: ${chordNames.join(', ')}`);

            // ChordScaleConfigを自動生成（範囲指定オプション付き）
            const config = generateChordScaleConfigWithRange(chordNames, noteRange, useVoicingAlgorithm, consolidateScales);

            // 生成されたスケール名を取得（実際のスケール名を使用）
            const scaleNames = config.scales.map((_, index) => {
                // 実際に生成されたスケール名を取得
                const generatedScaleNames = generateScalesFromChords(chordNames);
                if (generatedScaleNames.length > 0 && index === 0) {
                    return generatedScaleNames[0]; // 例: "C major", "D dorian"
                }
                return `Scale ${index}`;
            });

            const newData: GeneratedData = {
                config,
                chordNames,
                scaleNames,
                aiResponse: generatedData.aiResponse // AI応答は変更しない
            };

            setGeneratedData(newData);
            addEventLog('SUCCESS', `パターン ${patternIndex + 1} のデータを再生成しました`, {
                chords: chordNames.length,
                scales: config.scales.length,
                relations: config.chord_scale_relations.length
            });

        } catch (error) {
            addEventLog('ERROR', `パターン ${patternIndex + 1} のデータ再生成でエラーが発生しました`, error);
        }
    }, [generatedData, noteRange, useVoicingAlgorithm, consolidateScales, addEventLog]);

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
                <h1 className="text-3xl font-bold">AI Chord Generation Test</h1>

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

                {/* Gemini API設定セクション */}
                <div className="bg-card text-card-foreground rounded-lg border p-6">
                    <h2 className="text-xl font-semibold mb-4">Gemini API設定</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Gemini APIキー
                            </label>
                            {apiKey ? (
                                <div className="p-3 bg-green-100 text-green-800 rounded-md">
                                    ✓ 環境変数からAPIキーが設定されています
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md">
                                        ⚠️ APIキーが設定されていません
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <p className="font-medium mb-2">設定方法:</p>
                                        <ol className="list-decimal list-inside space-y-1">
                                            <li>プロジェクトルートに <code className="bg-gray-100 px-1 rounded">.env.local</code> ファイルを作成</li>
                                            <li>以下の内容を追加:</li>
                                        </ol>
                                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs">
                                            NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
                                        </pre>
                                        <p className="mt-2">
                                            Google AI Studioで無料で取得できます: <a href="https://ai.google.dev/gemini-api/docs/quickstart?hl=ja" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">https://ai.google.dev/gemini-api/docs/quickstart?hl=ja</a>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* AIプロンプト入力セクション */}
                <div className="bg-card text-card-foreground rounded-lg border p-6">
                    <h2 className="text-xl font-semibold mb-4">AIプロンプト入力</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                プロンプトを編集してください
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="プロンプトを入力してください"
                                className="w-full h-64 p-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                                disabled={isGenerating}
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={generateChordProgressions}
                                disabled={isGenerating || !prompt.trim() || !apiKey.trim()}
                                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? 'AI生成中...' : 'AIコード進行生成'}
                            </button>
                            {!apiKey.trim() && (
                                <div className="text-sm text-red-600">
                                    APIキーが設定されていません。上記の設定方法に従って環境変数を設定してください。
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* AI生成結果表示セクション */}
                {generatedData && (
                    <div className="bg-card text-card-foreground rounded-lg border p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">AI生成結果</h2>
                            <button
                                onClick={sendChordScaleConfigToDevice}
                                disabled={!selectedDevice}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                デバイスに送信
                            </button>
                        </div>

                        {/* パターン選択 */}
                        <div className="mb-6">
                            <h3 className="font-semibold mb-2">生成されたパターン選択</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {generatedData.aiResponse.chord_progressions.map((pattern, index) => (
                                    <button
                                        key={pattern.pattern_id}
                                        onClick={() => {
                                            setSelectedPattern(index);
                                            // パターン選択時にデータを再生成
                                            updateGeneratedDataForPattern(index, generatedData.aiResponse.chord_progressions);
                                        }}
                                        className={`p-3 text-left border rounded-md transition-colors ${selectedPattern === index
                                            ? 'border-primary bg-primary/10'
                                            : 'hover:bg-muted'
                                            }`}
                                    >
                                        <div className="font-medium">パターン {pattern.pattern_id}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {pattern.metadata.key} / {pattern.metadata.time_signature} / {pattern.metadata.total_beats}拍
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {pattern.timeline.map(item => item.chord_name).join(' - ')}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* コード進行プレビュー */}
                        <div className="mb-6">
                            <ChordProgressionPreview
                                progression={generatedData.aiResponse.chord_progressions[selectedPattern]}
                                isPlaying={isPreviewPlaying}
                                onPlayStateChange={setIsPreviewPlaying}
                            />
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

export default AIChordGenerationPage;
