'use client';

import React, { useState, useCallback } from 'react';
import { scaleToNotes, notesToNames, validateScaleName } from '@/lib/utils/tonal-chordscale';

interface ScaleAnalysisResult {
    scaleName: string;
    notes: number[];
    noteNames: string[];
}

interface ScaleAnalyzerProps {
    compatibleScales: string[];
    onScaleSelected: (result: ScaleAnalysisResult) => void;
    onError: (error: string) => void;
}

const ScaleAnalyzer: React.FC<ScaleAnalyzerProps> = ({
    compatibleScales,
    onScaleSelected,
    onError
}) => {
    const [customScaleName, setCustomScaleName] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzeScale = useCallback(async (scaleName: string) => {
        setIsAnalyzing(true);

        try {
            // スケール名の妥当性をチェック
            const validation = validateScaleName(scaleName);
            if (!validation.isValid) {
                onError(validation.error || 'Invalid scale name');
                return;
            }

            // スケールのノート配列を生成
            const notes = scaleToNotes(scaleName);
            if (notes.length === 0) {
                onError('スケールの解析に失敗しました');
                return;
            }

            // ノート名を取得
            const noteNames = notesToNames(notes);

            const result: ScaleAnalysisResult = {
                scaleName,
                notes,
                noteNames
            };

            onScaleSelected(result);
        } catch (error) {
            onError(`スケールの解析中にエラーが発生しました: ${error}`);
        } finally {
            setIsAnalyzing(false);
        }
    }, [onScaleSelected, onError]);

    const handleCustomScaleSubmit = () => {
        if (customScaleName.trim()) {
            analyzeScale(customScaleName.trim());
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCustomScaleSubmit();
        }
    };

    return (
        <div className="bg-card text-card-foreground rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">スケール分析・選択</h3>

            <div className="space-y-4">
                {/* 推奨スケール一覧 */}
                {compatibleScales.length > 0 && (
                    <div>
                        <h4 className="text-md font-medium mb-2">推奨スケール</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {compatibleScales.map((scaleName, index) => (
                                <button
                                    key={index}
                                    onClick={() => analyzeScale(scaleName)}
                                    disabled={isAnalyzing}
                                    className="p-3 text-left border rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="font-medium">{scaleName}</div>
                                    <div className="text-sm text-muted-foreground">
                                        クリックして分析
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* カスタムスケール入力 */}
                <div>
                    <h4 className="text-md font-medium mb-2">カスタムスケール</h4>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={customScaleName}
                            onChange={(e) => setCustomScaleName(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="例: C major, D dorian, F# harmonic minor"
                            className="flex-1 p-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={isAnalyzing}
                        />
                        <button
                            onClick={handleCustomScaleSubmit}
                            disabled={isAnalyzing || !customScaleName.trim()}
                            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? '分析中...' : '分析実行'}
                        </button>
                    </div>
                </div>

                <div className="text-sm text-muted-foreground">
                    <p>対応するスケール名の例:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>メジャースケール: C major, D major</li>
                        <li>マイナースケール: C minor, D minor</li>
                        <li>モード: C dorian, C phrygian, C lydian</li>
                        <li>その他: C harmonic minor, C pentatonic major</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ScaleAnalyzer;
