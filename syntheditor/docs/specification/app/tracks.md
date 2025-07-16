# トラック管理仕様

## 1. 概要
Syntheveryの各デバイスは8つのトラックを持ち、各トラックに楽器やシーケンサーを割り当てて演奏・制御を行います。本ドキュメントでは、トラック構成・状態管理・選択状態について記述します。

## 2. トラック構成
- 各デバイスは8トラック（Track-1〜Track-8）を持つ
- 各トラックには楽器・シーケンサーを個別に割り当て可能

## 3. トラック状態（TrackState）
- 各トラックは以下の状態を持つ
  - ループ長（ティック）
  - ミュート
  - 音量
- 例: TypeScriptインターフェース
```typescript
// 実装に合わせたTrackState
interface TrackState {
  loopLengthTick: number;
  mute: boolean;
  volume: number;
}
```

## 4. トラック選択状態（CurrentTracksState）
- 各デバイスが現在どのトラックを選択しているかを管理
- 例: TypeScriptインターフェース
```typescript
// 実装に合わせたCurrentTracksState
// Map型で管理
 type CurrentTracksState = Map<string, number>; // deviceIdごとに選択中のトラック番号
```

## 5. 運用例・ユースケース
- 例1: 全デバイスがTrack-1を選択
- 例2: 左右手足のデバイスで異なるトラックを選択し、複雑なアンサンブルを構成 