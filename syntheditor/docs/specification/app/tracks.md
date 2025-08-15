# トラック管理仕様

## 1. 概要
Syntheveryの各デバイスは8つのトラックを持ち、各トラックに楽器やシーケンサーを割り当てて演奏・制御を行います。本ドキュメントでは、トラック構成・状態管理・選択状態・楽器設定について記述します。

## 2. トラック構成
- 各デバイスは8トラック（Track-1〜Track-8）を持つ
- 各トラックには楽器・シーケンサーを個別に割り当て可能

## 3. 楽器プリセット管理

### 3.1 楽器プリセット（InstrumentPreset）
アプリ側で楽器の設定を管理するためのプリセットシステムです。

```typescript
interface InstrumentPreset {
  id: string;                    // 一意のID
  displayName: string;           // 表示名
  icon: string;                  // アイコン識別子
  noteBuilderConfig: NoteBuilderConfig;  // モーション検知設定
  generatorConfig: GeneratorConfig;      // 音声生成設定
  tags?: string[];               // 検索・フィルタ用タグ
}
```

### 3.2 プリセットの特徴
- **NoteBuilderConfig**: モーションからノートを作成する設定
- **GeneratorConfig**: ノートを基に音声を生成する設定
- **統合管理**: 両設定を一つの楽器として管理
- **豊富なプリセット**: アプリ側で多数のプリセットを保持

## 4. デバイス側トラック設定

### 4.1 TrackDetail
デバイス側で各トラックの基本情報を保持する設定です。

```typescript
interface TrackDetail {
  displayName: string;           // デバイス側での表示名
  icon: string;                  // アイコン識別子
  instrumentPresetId: string;    // 使用中の楽器プリセットID
}
```

### 4.2 デバイス側での管理
```typescript
// 8トラックの配列として管理
TrackDetail[] tracks = new TrackDetail[8];
```

### 4.3 アプリ側でのTrackDetail保持
- アプリ側でもTrackDetailを保持し、デバイス側と同期
- 接続時にデバイスからTrackDetailを取得
- NoteBuilderConfig、GeneratorConfigと同様の取得フロー

### 4.4 設定の同期
- アプリ接続時にTrackDetailを読み取り
- アプリ側の楽器名とアイコンを調整可能
- プリセットの整合性はアプリ側が全Configを管理するため保証される
- TrackDetailの変更時はアプリ側とデバイス側で双方向同期

## 5. トラック状態（TrackState）
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

## 6. トラック選択状態（CurrentTracksState）
- 各デバイスが現在どのトラックを選択しているかを管理
- 例: TypeScriptインターフェース
```typescript
// 実装に合わせたCurrentTracksState
// Map型で管理
 type CurrentTracksState = Map<string, number>; // deviceIdごとに選択中のトラック番号
```

## 7. 運用例・ユースケース
- 例1: 全デバイスがTrack-1を選択
- 例2: 左右手足のデバイスで異なるトラックを選択し、複雑なアンサンブルを構成
- 例3: 楽器プリセットを使用した楽器設定の一括適用
- 例4: デバイス固有のトラック名とアイコンの表示 