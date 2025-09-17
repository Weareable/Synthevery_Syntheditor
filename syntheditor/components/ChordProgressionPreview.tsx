'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { chordToNotes } from '../lib/utils/tonal-chordscale';

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

interface ChordProgressionPreviewProps {
    progression: GeneratedChordProgression;
    isPlaying: boolean;
    onPlayStateChange: (isPlaying: boolean) => void;
}

const ChordProgressionPreview: React.FC<ChordProgressionPreviewProps> = ({
    progression,
    isPlaying,
    onPlayStateChange
}) => {
    const samplerRef = useRef<Tone.Sampler | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSamplerReady, setIsSamplerReady] = useState(false);
    const [currentChordIndex, setCurrentChordIndex] = useState(0);
    const [currentBeat, setCurrentBeat] = useState(0);
    const [isLooping, setIsLooping] = useState(false);
    const partRef = useRef<Tone.Part | null>(null);

    // デバッグログ用の状態
    const [debugLogs, setDebugLogs] = useState<Array<{
        timestamp: Date;
        chordName: string;
        relativeNotes: number[];
        midiNotes: number[];
        toneNotes: string[];
        message: string;
    }>>([]);

    // サンプラーの初期化
    useEffect(() => {
        const initSampler = async () => {
            try {
                // 既にサンプラーが存在する場合は初期化をスキップ
                if (samplerRef.current) {
                    console.log('サンプラーは既に初期化済みです');
                    return;
                }

                setIsLoading(true);

                // より多くの音符を読み込むようにサンプラーを設定
                const newSampler = new Tone.Sampler({
                    urls: {
                        'C4': 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', 'A4': 'A4.mp3',
                        'C5': 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', 'A5': 'A5.mp3'
                    },
                    baseUrl: "https://tonejs.github.io/audio/salamander/",
                    onload: () => {
                        setIsLoading(false);
                        setIsSamplerReady(true);
                        console.log('ピアノサンプルが読み込まれました');
                    },
                    onerror: (error) => {
                        console.error('サンプル読み込みエラー:', error);
                        setIsLoading(false);
                        // エラーが発生しても基本的なサンプルは利用可能にする
                        setIsSamplerReady(true);
                    }
                }).toDestination();

                samplerRef.current = newSampler;
            } catch (error) {
                console.error('サンプラー初期化エラー:', error);
                setIsLoading(false);
            }
        };

        initSampler();

        return () => {
            // クリーンアップはコンポーネントのアンマウント時のみ実行
            if (samplerRef.current) {
                samplerRef.current.dispose();
                samplerRef.current = null;
            }
        };
    }, []); // 依存配列を空にして、初回のみ実行

    // デバッグログを追加する関数
    const addDebugLog = useCallback((chordName: string, relativeNotes: number[], midiNotes: number[], toneNotes: string[], message: string) => {
        const newLog = {
            timestamp: new Date(),
            chordName,
            relativeNotes: [...relativeNotes],
            midiNotes: [...midiNotes],
            toneNotes: [...toneNotes],
            message
        };
        setDebugLogs(prev => [newLog, ...prev.slice(0, 19)]); // 最新20件を保持
    }, []);

    // コード名から音符配列を生成する関数（MIDIノート番号を使用）
    const getChordNotes = useCallback((chordName: string): string[] => {
        try {
            // tonal-chordscaleのchordToNotes関数を使用して相対ノート番号を取得
            const relativeNotes = chordToNotes(chordName);

            if (relativeNotes && relativeNotes.length > 0) {
                // 相対ノート番号をMIDIノート番号に変換（C4 = 60を基準）
                const midiNotes = relativeNotes.map(rel => 60 + rel);

                // MIDIノート番号をTone.jsの音符表記に変換
                const notes = midiNotes.map(midi => {
                    const octave = Math.floor(midi / 12) - 1;
                    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                    const noteName = noteNames[midi % 12];
                    return `${noteName}${octave}`;
                });

                // デバッグログを追加
                addDebugLog(chordName, relativeNotes, midiNotes, notes, '正常に変換完了');

                console.log(`コード ${chordName} の変換過程:`, {
                    relativeNotes,
                    midiNotes,
                    toneNotes: notes
                });

                return notes;
            }

            // フォールバック: 基本的なコード音程
            const fallbackMap: { [key: string]: string[] } = {
                'Cmaj7': ['C4', 'E4', 'G4', 'B4'],
                'Cmaj9': ['C4', 'E4', 'G4', 'B4', 'D5'],
                'Fmaj7#11': ['F4', 'A4', 'C5', 'E5', 'B4'],
                'Em7': ['E4', 'G4', 'B4', 'D5'],
                'A7b13': ['A4', 'C#5', 'E5', 'G5', 'F5'],
                'Am7b5': ['A4', 'C5', 'Eb5', 'G5'],
            };

            const fallbackNotes = fallbackMap[chordName] || ['C4', 'E4', 'G4', 'A4'];
            const fallbackMidi = fallbackNotes.map(note => {
                // Tone.jsの音符表記をMIDIノート番号に変換
                const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                const octave = parseInt(note.slice(-1));
                const noteName = note.slice(0, -1);
                const noteIndex = noteNames.indexOf(noteName);
                return (octave + 1) * 12 + noteIndex;
            });
            const fallbackRelative = fallbackMidi.map(midi => midi - 60);

            addDebugLog(chordName, fallbackRelative, fallbackMidi, fallbackNotes, 'フォールバック使用');

            return fallbackNotes;
        } catch (error) {
            console.error('コード解析エラー:', error);
            const errorNotes = ['C4', 'E4', 'G4', 'A4'];
            const errorMidi = [60, 64, 67, 69];
            const errorRelative = [0, 4, 7, 9];

            addDebugLog(chordName, errorRelative, errorMidi, errorNotes, `エラー: ${error}`);

            return errorNotes;
        }
    }, [addDebugLog]);

    // コード進行の再生
    const playProgression = useCallback(async () => {
        if (!samplerRef.current || !progression || isLoading || !isSamplerReady) return;

        try {
            // Tone.jsのコンテキストを開始（ユーザーインタラクション後）
            if (Tone.context.state !== 'running') {
                await Tone.start();
                console.log('Tone.jsコンテキストを開始しました');
            }
            // 既存のパートを停止・削除
            if (partRef.current) {
                partRef.current.dispose();
            }

            // Transportをリセット
            Tone.Transport.stop();
            Tone.Transport.cancel();
            Tone.Transport.position = 0;

            // BPMを設定（より速いテンポに変更）
            Tone.Transport.bpm.value = 140;

            // パートを作成（各コードを正確なタイミングで発音）
            const events: Array<[string, string[]]> = [];
            let accumulatedBeats = 0;
            // 4/4拍子を想定
            const timeSignatureNumerator = 4;

            progression.timeline.forEach((item, index) => {
                const chordNotes = getChordNotes(item.chord_name);

                // 拍数を小節:拍:16分音符の形式に変換
                const bars = Math.floor(accumulatedBeats / timeSignatureNumerator);
                const beatsInBar = accumulatedBeats % timeSignatureNumerator;
                const timeString = `${bars}:${beatsInBar}:0`;

                events.push([timeString, chordNotes]);
                console.log(`コード ${index}: ${item.chord_name} を ${timeString} に設定 (${chordNotes.join(', ')})`);
                accumulatedBeats += item.duration_beats;
            });

            console.log('作成されたイベント:', events);

            partRef.current = new Tone.Part((time, chord) => {
                console.log('パートイベント発火:', { time, chord, transportPosition: Tone.Transport.position });
                if (samplerRef.current && chord && Array.isArray(chord)) {
                    chord.forEach(note => {
                        console.log('音符を発音:', note);
                        samplerRef.current!.triggerAttackRelease(note, "4n", time);
                    });

                    // 発音時のデバッグログを追加
                    addDebugLog('発音中', [], [], chord, `時刻: ${time}, Transport位置: ${Tone.Transport.position}`);
                }
            }, events);

            // Transportのループ設定
            const totalBeats = progression.metadata.total_beats;
            const totalBars = Math.ceil(totalBeats / timeSignatureNumerator);
            Tone.Transport.loopEnd = `${totalBars}:0:0`;
            Tone.Transport.loop = true;

            // パートを開始
            partRef.current.start(0);
            Tone.Transport.start();
            setIsLooping(true);

            console.log('コード進行再生開始:', {
                events: events,
                totalBeats: totalBeats,
                totalBars: totalBars,
                bpm: Tone.Transport.bpm.value,
                timeline: progression.timeline
            });

            onPlayStateChange(true);
        } catch (error) {
            console.error('再生エラー:', error);
        }
    }, [progression, getChordNotes, onPlayStateChange, isLoading, isSamplerReady]);

    // 停止
    const stopProgression = useCallback(() => {
        try {
            Tone.Transport.stop();
            Tone.Transport.loop = false;
            if (partRef.current) {
                partRef.current.dispose();
                partRef.current = null;
            }
            onPlayStateChange(false);
            setCurrentChordIndex(0);
            setCurrentBeat(0);
            setIsLooping(false);
        } catch (error) {
            console.error('停止エラー:', error);
        }
    }, [onPlayStateChange]);

    // 現在のコードインデックスを更新する関数
    const updateCurrentChordIndex = useCallback(() => {
        if (!progression || !isLooping) return;

        try {
            const currentPosition = Tone.Transport.position;
            // Transportの位置を拍数に変換
            const positionInSeconds = Tone.Time(currentPosition).toSeconds();
            const beatsPerSecond = Tone.Transport.bpm.value / 60;
            const beatNumber = Math.floor(positionInSeconds * beatsPerSecond) % progression.metadata.total_beats;

            // 正確なコードインデックスを計算（duration_beatsに基づく）
            let accumulatedBeats = 0;
            let chordIndex = 0;

            for (let i = 0; i < progression.timeline.length; i++) {
                const chordDuration = progression.timeline[i].duration_beats;
                if (beatNumber >= accumulatedBeats && beatNumber < accumulatedBeats + chordDuration) {
                    chordIndex = i;
                    break;
                }
                accumulatedBeats += chordDuration;
            }

            setCurrentChordIndex(chordIndex);
            setCurrentBeat(beatNumber);

            // デバッグログ（最初の数回のみ）
            if (beatNumber < 20) {
                console.log('現在位置更新:', {
                    position: currentPosition,
                    beatNumber,
                    chordIndex,
                    chordName: progression.timeline[chordIndex]?.chord_name,
                    accumulatedBeats: accumulatedBeats
                });
            }
        } catch (error) {
            console.error('現在位置更新エラー:', error);
        }
    }, [progression, isLooping]);

    // 再生状態の監視
    useEffect(() => {
        if (isPlaying) {
            playProgression();
        } else {
            stopProgression();
        }
    }, [isPlaying, playProgression, stopProgression]);

    // ループ中の現在位置更新
    useEffect(() => {
        if (!isLooping) return;

        const interval = setInterval(updateCurrentChordIndex, 100); // 100msごとに更新
        return () => clearInterval(interval);
    }, [isLooping, updateCurrentChordIndex]);

    // クリーンアップ
    useEffect(() => {
        return () => {
            stopProgression();
        };
    }, [stopProgression]);

    return (
        <div className="bg-card text-card-foreground rounded-lg border p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">コード進行プレビュー</h3>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            if (samplerRef.current && isSamplerReady) {
                                try {
                                    // Tone.jsのコンテキストを開始
                                    if (Tone.context.state !== 'running') {
                                        await Tone.start();
                                        console.log('Tone.jsコンテキストを開始しました');
                                    }
                                    console.log('テスト音を発音');
                                    samplerRef.current.triggerAttackRelease("C4", "4n");
                                } catch (error) {
                                    console.error('テスト音発音エラー:', error);
                                }
                            }
                        }}
                        disabled={!samplerRef.current || !isSamplerReady}
                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        テスト音
                    </button>
                    <button
                        onClick={() => onPlayStateChange(!isPlaying)}
                        disabled={isLoading || !samplerRef.current || !isSamplerReady}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${isPlaying
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isLoading ? '読み込み中...' : isPlaying ? '停止' : '再生'}
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="text-center py-4">
                    <div className="text-sm text-muted-foreground">ピアノサンプルを読み込み中...</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        初回読み込みには数秒かかる場合があります
                    </div>
                </div>
            )}

            {!isLoading && !isSamplerReady && (
                <div className="text-center py-4">
                    <div className="text-sm text-yellow-600">サンプル読み込み中...</div>
                </div>
            )}

            {!isLoading && isSamplerReady && progression && (
                <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                        キー: {progression.metadata.key} /
                        拍子: {progression.metadata.time_signature} /
                        総拍数: {progression.metadata.total_beats}拍 /
                        テンポ: 140BPM
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {progression.timeline.map((item, index) => (
                            <div
                                key={index}
                                className={`p-3 border rounded-md text-center transition-colors ${isPlaying && currentChordIndex === index
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border'
                                    }`}
                            >
                                <div className="font-medium text-sm">{item.chord_name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {item.duration_beats}拍
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        ※ 各コードは4分音符の長さで再生されます（140BPM）
                    </div>

                    {isLooping && (
                        <div className="text-xs text-blue-600">
                            現在の拍: {currentBeat} / 現在のコード: {progression.timeline[currentChordIndex]?.chord_name}
                        </div>
                    )}

                    {/* デバッグログ表示 */}
                    <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-semibold">音の変換デバッグログ</h4>
                            <button
                                onClick={() => setDebugLogs([])}
                                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                            >
                                クリア
                            </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                            {debugLogs.map((log, index) => (
                                <div key={index} className="text-xs bg-gray-50 p-2 rounded border">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium text-blue-600">{log.chordName}</span>
                                        <span className="text-gray-500">{log.timestamp.toLocaleTimeString()}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <div className="font-medium text-gray-600">相対ノート:</div>
                                            <div className="text-gray-800">[{log.relativeNotes.join(', ')}]</div>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-600">MIDIノート:</div>
                                            <div className="text-gray-800">[{log.midiNotes.join(', ')}]</div>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-600">Tone.js音符:</div>
                                            <div className="text-gray-800">[{log.toneNotes.join(', ')}]</div>
                                        </div>
                                    </div>
                                    <div className="text-gray-600 mt-1">{log.message}</div>
                                </div>
                            ))}
                            {debugLogs.length === 0 && (
                                <div className="text-gray-500 text-center py-2">デバッグログはありません</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChordProgressionPreview;
