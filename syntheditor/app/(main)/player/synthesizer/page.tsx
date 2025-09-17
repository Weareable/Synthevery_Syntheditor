'use client'
import React, { useState } from 'react'
import { ToggleButton } from '@/components/ui/toggle-button'
import useMesh from '@/hooks/useMesh'

export default function SynthesizerPage() {
    const [isMuted, setIsMuted] = useState(false);
    const [selectedOctave, setSelectedOctave] = useState(4);

    const { connectedDevices, connectedPeers, connectDevice, disconnectDevice } = useMesh();

    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-200 p-6">
            <div className="text-4xl mb-6">🎹</div>
            <div className="text-2xl mb-4">シンセサイザー</div>
            <div className="text-zinc-400 mb-8">メロディとハーモニーを作成</div>

            {/* デバイス状態表示 */}
            <div className="mb-8 w-full max-w-md">
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                    <div className="text-sm mb-2 text-zinc-400">デバイス状態</div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-300">接続済みデバイス:</span>
                            <span className={`text-sm ${connectedDevices.length > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {connectedDevices.length > 0 ? connectedDevices.join(', ') : 'なし'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-300">ピア接続:</span>
                            <span className="text-sm text-zinc-400">
                                {connectedPeers.length}台
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* コントロール */}
            <div className="mb-8 flex gap-6">
                <div>
                    <div className="text-sm mb-2 text-zinc-400">ミュート</div>
                    <ToggleButton
                        pressed={isMuted}
                        onPressedChange={setIsMuted}
                    >
                        M
                    </ToggleButton>
                </div>
                <div>
                    <div className="text-sm mb-2 text-zinc-400">オクターブ</div>
                    <div className="flex gap-1">
                        {[2, 3, 4, 5, 6].map((octave) => (
                            <button
                                key={octave}
                                onClick={() => setSelectedOctave(octave)}
                                className={`w-8 h-8 rounded text-xs transition-colors ${selectedOctave === octave
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                                    }`}
                            >
                                {octave}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ピアノキーボード */}
            <div className="w-full max-w-4xl">
                <div className="grid grid-cols-12 gap-1 mb-4">
                    {notes.map((note, i) => (
                        <button
                            key={i}
                            className={`h-20 rounded transition-colors ${note.includes('#')
                                    ? 'bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 text-xs'
                                    : 'bg-zinc-700 border border-zinc-600 hover:bg-zinc-600'
                                }`}
                        >
                            <div className="text-xs text-zinc-400 mb-1">{note}</div>
                            <div className="text-lg font-bold">{selectedOctave}</div>
                        </button>
                    ))}
                </div>

                {/* オクターブ表示 */}
                <div className="text-center text-sm text-zinc-400">
                    オクターブ {selectedOctave}
                </div>
            </div>
        </div>
    )
} 