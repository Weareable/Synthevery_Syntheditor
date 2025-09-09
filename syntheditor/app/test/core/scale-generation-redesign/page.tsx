'use client';

import React, { useState } from 'react';
import { generateScalesFromChords, getChordNotes, detectScalesFromNotes, expandScaleModes, consolidateScaleNames } from '@/lib/utils/tonal-chordscale';

export default function ScaleGenerationRedesignTest() {
    const [chordNames, setChordNames] = useState<string>('Cmaj7, Dm7, G7, Am7');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const testScaleGeneration = async () => {
        setLoading(true);
        try {
            const chordArray = chordNames.split(',').map(name => name.trim()).filter(name => name.length > 0);

            console.log('Testing new scale generation approach...');
            console.log('Input chord names:', chordArray);

            const generatedScales = generateScalesFromChords(chordArray);

            // 詳細なテスト結果を生成
            const detailedResults = chordArray.map(chordName => {
                const chordNotes = getChordNotes(chordName);
                const detectedScales = detectScalesFromNotes(chordNotes);
                const expandedModes = detectedScales.flatMap(scaleName => expandScaleModes(scaleName));

                return {
                    chordName,
                    chordNotes,
                    detectedScales,
                    expandedModes
                };
            });

            setResult({
                inputChords: chordArray,
                generatedScales,
                detailedResults,
                consolidatedScales: consolidateScaleNames(generatedScales)
            });

        } catch (error) {
            console.error('Error testing scale generation:', error);
            setResult({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">スケール生成機能 リデザインテスト</h1>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">新しいアプローチのテスト</h2>
                <p className="mb-4 text-gray-600">
                    コード名のリストから、Chord.notes()で構成音を取得し、Scale.detect()でスケール候補を検出、
                    modeNamesでモード拡張を行い、重複を統合する新しいアプローチをテストします。
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">コード名（カンマ区切り）:</label>
                    <input
                        type="text"
                        value={chordNames}
                        onChange={(e) => setChordNames(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="例: Cmaj7, Dm7, G7, Am7"
                    />
                </div>

                <button
                    onClick={testScaleGeneration}
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                    {loading ? 'テスト中...' : 'スケール生成テスト'}
                </button>
            </div>

            {result && (
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">テスト結果</h2>

                    {result.error ? (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            エラー: {result.error}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* 入力コード */}
                            <div className="bg-gray-50 p-4 rounded">
                                <h3 className="font-semibold mb-2">入力コード:</h3>
                                <p className="text-sm text-gray-600">{result.inputChords.join(', ')}</p>
                            </div>

                            {/* 最終的な統合されたスケール */}
                            <div className="bg-green-50 p-4 rounded">
                                <h3 className="font-semibold mb-2">最終的な統合されたスケール:</h3>
                                <div className="text-sm">
                                    {result.consolidatedScales.map((scale: string, index: number) => (
                                        <span key={index} className="inline-block bg-green-200 px-2 py-1 rounded mr-2 mb-1">
                                            {scale}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* 生成されたスケール（統合前） */}
                            <div className="bg-blue-50 p-4 rounded">
                                <h3 className="font-semibold mb-2">生成されたスケール（統合前）:</h3>
                                <div className="text-sm">
                                    {result.generatedScales.map((scale: string, index: number) => (
                                        <span key={index} className="inline-block bg-blue-200 px-2 py-1 rounded mr-2 mb-1">
                                            {scale}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* 詳細結果 */}
                            <div className="bg-yellow-50 p-4 rounded">
                                <h3 className="font-semibold mb-2">詳細結果（各コードごと）:</h3>
                                <div className="space-y-4">
                                    {result.detailedResults.map((detail: any, index: number) => (
                                        <div key={index} className="border-l-4 border-yellow-400 pl-4">
                                            <h4 className="font-medium text-lg">{detail.chordName}</h4>
                                            <div className="text-sm space-y-2">
                                                <div>
                                                    <strong>構成音:</strong>
                                                    <span className="ml-2 text-gray-600">
                                                        [{detail.chordNotes.join(', ')}]
                                                    </span>
                                                </div>
                                                <div>
                                                    <strong>検出されたスケール:</strong>
                                                    <div className="ml-2 mt-1">
                                                        {detail.detectedScales.map((scale: string, i: number) => (
                                                            <span key={i} className="inline-block bg-yellow-200 px-2 py-1 rounded mr-1 mb-1 text-xs">
                                                                {scale}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <strong>モード拡張後:</strong>
                                                    <div className="ml-2 mt-1">
                                                        {detail.expandedModes.map((mode: string, i: number) => (
                                                            <span key={i} className="inline-block bg-orange-200 px-2 py-1 rounded mr-1 mb-1 text-xs">
                                                                {mode}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
