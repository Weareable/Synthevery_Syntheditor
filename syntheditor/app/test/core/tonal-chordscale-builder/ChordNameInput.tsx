'use client';

import React, { useState, useCallback } from 'react';
import { chordToNotes, notesToNames, validateChordName, findCompatibleScales } from '@/lib/utils/tonal-chordscale';

interface ChordAnalysisResult {
    chordName: string;
    notes: number[];
    noteNames: string[];
    compatibleScales: string[];
}

interface ChordNameInputProps {
    onAnalysisComplete: (result: ChordAnalysisResult) => void;
    onError: (error: string) => void;
}

const ChordNameInput: React.FC<ChordNameInputProps> = ({ onAnalysisComplete, onError }) => {
    const [chordName, setChordName] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzeChord = useCallback(async () => {
        if (!chordName.trim()) {
            onError('コード名を入力してください');
            return;
        }

        setIsAnalyzing(true);

        try {
            // コード名の妥当性をチェック
            const validation = validateChordName(chordName.trim());
            if (!validation.isValid) {
                onError(validation.error || 'Invalid chord name');
                return;
            }

            // コードのノート配列を生成
            const notes = chordToNotes(chordName.trim());
            if (notes.length === 0) {
                onError('コードの解析に失敗しました');
                return;
            }

            // ノート名を取得
            const noteNames = notesToNames(notes);

            // 適合するスケールを検索
            const compatibleScales = findCompatibleScales(chordName.trim());

            const result: ChordAnalysisResult = {
                chordName: chordName.trim(),
                notes,
                noteNames,
                compatibleScales
            };

            onAnalysisComplete(result);
        } catch (error) {
            onError(`コードの解析中にエラーが発生しました: ${error}`);
        } finally {
            setIsAnalyzing(false);
        }
    }, [chordName, onAnalysisComplete, onError]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            analyzeChord();
        }
    };

    return (
        <div className="bg-card text-card-foreground rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">コード名入力・分析</h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        コード名を入力してください
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={chordName}
                            onChange={(e) => setChordName(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="例: Cmaj7, Dm7, G7, F#m7b5"
                            className="flex-1 p-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={isAnalyzing}
                        />
                        <button
                            onClick={analyzeChord}
                            disabled={isAnalyzing || !chordName.trim()}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? '分析中...' : '分析実行'}
                        </button>
                    </div>
                </div>

                <div className="text-sm text-muted-foreground">
                    <p>対応するコード名の例:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>メジャーコード: C, Cmaj, Cmaj7, Cmaj9</li>
                        <li>マイナーコード: Cm, Cmin, Cm7, Cm9</li>
                        <li>セブンスコード: C7, Cm7, Cmaj7, Cm7b5</li>
                        <li>その他: Csus4, Cadd9, Cdim, Caug</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ChordNameInput;
