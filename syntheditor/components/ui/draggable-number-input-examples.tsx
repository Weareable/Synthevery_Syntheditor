import React, { useState } from "react";
import { DraggableNumberInput } from "./draggable-number-input";

/**
 * DraggableNumberInputコンポーネントの使用例
 * 様々な設定で数値入力を実装できます
 */
export const DraggableNumberInputExamples: React.FC = () => {
    const [volume, setVolume] = useState(50);
    const [tempo, setTempo] = useState(120);
    const [pan, setPan] = useState(0);
    const [reverb, setReverb] = useState(0.5);

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold">DraggableNumberInput 使用例</h2>

            {/* 音量コントロール */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">音量コントロール</h3>
                <DraggableNumberInput
                    min={0}
                    max={100}
                    value={volume}
                    onValueChange={setVolume}
                    label="VOL"
                    unit="%"
                    step={1}
                    dragSensitivity={0.5}
                    showPopup={true}
                    popupLabel="VOLUME"
                />
                <p className="text-sm text-muted-foreground">
                    0-100%の範囲で1ステップずつ調整可能
                </p>
            </div>

            {/* テンポコントロール */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">テンポコントロール</h3>
                <DraggableNumberInput
                    min={60}
                    max={200}
                    value={tempo}
                    onValueChange={setTempo}
                    label="BPM"
                    step={1}
                    dragSensitivity={0.2}
                    showPopup={true}
                    popupLabel="BPM"
                />
                <p className="text-sm text-muted-foreground">
                    60-200 BPMの範囲で1ステップずつ調整可能
                </p>
            </div>

            {/* パンコントロール */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">パンコントロール</h3>
                <DraggableNumberInput
                    min={-100}
                    max={100}
                    value={pan}
                    onValueChange={setPan}
                    label="PAN"
                    unit="%"
                    step={5}
                    dragSensitivity={0.3}
                    showPopup={true}
                    popupLabel="PAN"
                />
                <p className="text-sm text-muted-foreground">
                    -100%から+100%の範囲で5ステップずつ調整可能
                </p>
            </div>

            {/* リバーブコントロール */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">リバーブコントロール</h3>
                <DraggableNumberInput
                    min={0}
                    max={1}
                    value={reverb}
                    onValueChange={setReverb}
                    label="REV"
                    step={0.1}
                    dragSensitivity={0.01}
                    showPopup={true}
                    popupLabel="REVERB"
                />
                <p className="text-sm text-muted-foreground">
                    0.0-1.0の範囲で0.1ステップずつ調整可能（高精度ドラッグ）
                </p>
            </div>

            {/* カスタムスタイル例 */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">カスタムスタイル例</h3>
                <div className="flex gap-4">
                    <DraggableNumberInput
                        min={0}
                        max={10}
                        value={5}
                        onValueChange={() => { }}
                        label="GAIN"
                        unit="dB"
                        step={0.5}
                        className="bg-blue-50 border-blue-200"
                    />
                    <DraggableNumberInput
                        min={0}
                        max={100}
                        value={25}
                        onValueChange={() => { }}
                        label="FREQ"
                        unit="Hz"
                        step={1}
                        className="bg-green-50 border-green-200"
                    />
                </div>
                <p className="text-sm text-muted-foreground">
                    カスタムCSSクラスでスタイルをカスタマイズ可能
                </p>
            </div>
        </div>
    );
};

export default DraggableNumberInputExamples;
