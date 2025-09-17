'use client';

import React, { useState, useCallback } from 'react';
import { ChordScaleConfig, ChordScaleSequence } from '@/types/chordScale';

interface SequenceEditorProps {
    config: ChordScaleConfig;
    onConfigUpdate: (config: ChordScaleConfig) => void;
    onError: (error: string) => void;
}

interface SequenceItem {
    id: string;
    tick: number;
    chordIds: number[];
    scaleWithRoots: Array<{ scale_id: number; root_offset: number }>;
}

const SequenceEditor: React.FC<SequenceEditorProps> = ({
    config,
    onConfigUpdate,
    onError
}) => {
    const [sequences, setSequences] = useState<SequenceItem[]>(() =>
        config.sequences.map((seq, index) => ({
            id: `seq-${index}`,
            tick: seq.tick,
            chordIds: seq.data.chord_ids,
            scaleWithRoots: seq.data.scale_with_roots
        }))
    );

    const [isEditing, setIsEditing] = useState(false);

    const updateSequence = useCallback((id: string, updates: Partial<SequenceItem>) => {
        setSequences(prev =>
            prev.map(seq =>
                seq.id === id ? { ...seq, ...updates } : seq
            )
        );
    }, []);

    const addSequence = useCallback(() => {
        const newTick = sequences.length > 0
            ? Math.max(...sequences.map(s => s.tick)) + 480
            : 0;

        const newSequence: SequenceItem = {
            id: `seq-${Date.now()}`,
            tick: newTick,
            chordIds: [0],
            scaleWithRoots: [{ scale_id: 0, root_offset: 0 }]
        };

        setSequences(prev => [...prev, newSequence]);
    }, [sequences]);

    const removeSequence = useCallback((id: string) => {
        setSequences(prev => prev.filter(seq => seq.id !== id));
    }, []);

    const saveChanges = useCallback(() => {
        try {
            const updatedSequences: ChordScaleSequence[] = sequences.map(seq => ({
                tick: seq.tick,
                data: {
                    chord_ids: seq.chordIds,
                    scale_with_roots: seq.scaleWithRoots
                }
            }));

            const updatedConfig: ChordScaleConfig = {
                ...config,
                sequences: updatedSequences,
                loop_length_tick: Math.max(...updatedSequences.map(s => s.tick)) + 480
            };

            onConfigUpdate(updatedConfig);
            setIsEditing(false);
        } catch (error) {
            onError(`シーケンスの保存中にエラーが発生しました: ${error}`);
        }
    }, [sequences, config, onConfigUpdate, onError]);

    const cancelChanges = useCallback(() => {
        setSequences(config.sequences.map((seq, index) => ({
            id: `seq-${index}`,
            tick: seq.tick,
            chordIds: seq.data.chord_ids,
            scaleWithRoots: seq.data.scale_with_roots
        })));
        setIsEditing(false);
    }, [config.sequences]);

    const handleTickChange = (id: string, tick: number) => {
        if (tick < 0) {
            onError('Tick値は0以上である必要があります');
            return;
        }
        updateSequence(id, { tick });
    };

    const handleChordIdsChange = (id: string, chordIdsStr: string) => {
        const chordIds = chordIdsStr
            .split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !Number.isNaN(n) && n >= 0 && n < config.chords.length);

        if (chordIds.length === 0) {
            onError('有効なコードIDを入力してください');
            return;
        }

        updateSequence(id, { chordIds });
    };

    const handleScaleWithRootsChange = (id: string, pairsStr: string) => {
        const scaleWithRoots = pairsStr
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .map(pair => {
                const [sid, ro] = pair.split(':');
                const scale_id = parseInt(sid?.trim() || '0');
                const root_offset = parseInt(ro?.trim() || '0');
                return {
                    scale_id: Number.isNaN(scale_id) ? 0 : scale_id,
                    root_offset: Number.isNaN(root_offset) ? 0 : root_offset
                };
            });

        if (scaleWithRoots.length === 0) {
            onError('有効なスケール:ルートオフセットのペアを入力してください');
            return;
        }

        updateSequence(id, { scaleWithRoots });
    };

    return (
        <div className="bg-card text-card-foreground rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">シーケンスエディタ</h3>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={saveChanges}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                保存
                            </button>
                            <button
                                onClick={cancelChanges}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                            >
                                キャンセル
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            編集開始
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {/* シーケンス一覧 */}
                <div className="space-y-3">
                    {sequences.map((sequence) => (
                        <div key={sequence.id} className="border rounded-md p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <h4 className="font-medium">シーケンス {sequences.indexOf(sequence) + 1}</h4>
                                {isEditing && (
                                    <button
                                        onClick={() => removeSequence(sequence.id)}
                                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                                    >
                                        削除
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Tick設定 */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tick</label>
                                    <input
                                        type="number"
                                        value={sequence.tick}
                                        onChange={(e) => handleTickChange(sequence.id, parseInt(e.target.value) || 0)}
                                        className="w-full p-2 border rounded-md bg-background"
                                        disabled={!isEditing}
                                        min="0"
                                        step="480"
                                    />
                                </div>

                                {/* Chord IDs設定 */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Chord IDs</label>
                                    <input
                                        type="text"
                                        value={sequence.chordIds.join(', ')}
                                        onChange={(e) => handleChordIdsChange(sequence.id, e.target.value)}
                                        className="w-full p-2 border rounded-md bg-background"
                                        disabled={!isEditing}
                                        placeholder="0, 1, 2"
                                    />
                                    <div className="text-xs text-muted-foreground mt-1">
                                        利用可能: 0-{config.chords.length - 1}
                                    </div>
                                </div>

                                {/* Scale with Roots設定 */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Scales (scale_id:root_offset)</label>
                                    <input
                                        type="text"
                                        value={sequence.scaleWithRoots.map(s => `${s.scale_id}:${s.root_offset}`).join(', ')}
                                        onChange={(e) => handleScaleWithRootsChange(sequence.id, e.target.value)}
                                        className="w-full p-2 border rounded-md bg-background"
                                        disabled={!isEditing}
                                        placeholder="0:0, 1:2"
                                    />
                                    <div className="text-xs text-muted-foreground mt-1">
                                        利用可能スケール: 0-{config.scales.length - 1}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 追加ボタン */}
                {isEditing && (
                    <button
                        onClick={addSequence}
                        className="w-full p-3 border-2 border-dashed border-muted-foreground rounded-md hover:border-primary transition-colors"
                    >
                        + シーケンスを追加
                    </button>
                )}

                {/* ループ長設定 */}
                <div className="border-t pt-4">
                    <label className="block text-sm font-medium mb-2">ループ長 (ticks)</label>
                    <input
                        type="number"
                        value={config.loop_length_tick}
                        onChange={(e) => {
                            const newConfig = {
                                ...config,
                                loop_length_tick: parseInt(e.target.value) || 0
                            };
                            onConfigUpdate(newConfig);
                        }}
                        className="w-full p-2 border rounded-md bg-background"
                        min="0"
                        step="480"
                    />
                </div>
            </div>
        </div>
    );
};

export default SequenceEditor;
