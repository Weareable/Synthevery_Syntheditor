## メーカーフェア出展用 Web アプリ 仕様（概要）

本ドキュメントは `mock.png` と `layout.png` を基に、出展デモ用アプリの全体仕様・UI原則・データモデル・同期方式を定義する。個別パネルの仕様は別紙を参照。

### 目的/スコープ
- **目的**: 売り場/展示での短時間体験に最適化された操作性と視覚効果を提供し、複数デバイスの同期演奏とマルチトラックを訴求する。
- **対象**: Next.js (App Router) + shadcn/ui + Tailwind。テーマ切替とアクセシビリティ配慮。
- **非対象**: 詳細なシーケンサ編集、プロジェクト保存、継続的なデータ管理。

### レイアウト
- 4パネル構成（`layout.png`）
  - 左サイド: ナビゲーション
  - 上段左: シーケンサーパネル（円環ビジュアライザ + トランスポート）
  - 上段右: トラックパネル（LIVE/MIX/EDITの3タブ）
  - 下段: デバイスパネル

### UI/デザインガイド
- shadcn/ui コンポーネントを優先採用（Button, Card, Tabs, Slider, Popover, Select, Toggle, Separator, ScrollArea 等）。
- Tailwind プリセットのサイズ/色トークンを基本に、`bg-card`, `border`, `muted`, `primary` などのトークンで統一。
- ダーク/ライト両対応（`ThemeProvider`）。コントラスト比はWCAG AA相当を確保。
- キーボード操作: 全インタラクティブ要素は `Tab` で到達、`Space/Enter` で発火。ARIA属性付与。

### コア連携（synthevery-core）
- 同期状態は `PlayerSyncStates` を介して操作/購読する。
  - `tickClockState` 読み取り（`playing`, `bpm`）
  - `metronomeState`, `quantizerState`, `recorderState` の読み書き
  - `trackStates: TrackState[]`（`loopLengthTick`, `mute`, `volume`）
  - `currentTracksState: Map<string, TrackEditMask>`（デバイス→編集対象 mask。v2: bit N = track N。**FW v2 同時デプロイ**）
- トランスポート: `DeviceController.setPlayingState('play'|'pause'|'stop')`, `setBpm(number)` を使用。
- 接続/同期の初期化は既存サービス初期化（`SyntheveryServiceContainer`）に依存。

### 単位系・タイムライン
- 内部の基準: 1小節 = 1920 tick（= 480 tick/拍 × 4拍）。
- UIの長さ選択: 16分音符を最小単位とし、`1/16 = 120 tick` としてマッピング。
  - 例: 1小節 → 1920、2小節 → 3840、1/2小節 → 960。

### 主要インタラクション
- BPM変更: 数値入力またはステッパー。入力はデバウンスして `setBpm` へ反映。
- 再生/停止/録音/メトロノーム/クオンタイザ: Toggle/Button で `PlayerSyncStates` を更新。
- トラック: LIVE でミュート切替、MIX でフェーダー、EDIT で `loopLengthTick`/音量/ミュート/楽器選択。
- デバイス: カード押下で Popover。選択トラック/楽器、マスターボリューム（当面 no-op）、MAC 表示。

### データモデル（抜粋）
```ts
type TrackEditMask = number; // v2: bit N = track N
type CurrentTracksState = Map<string, TrackEditMask>;

interface TrackState {
  loopLengthTick: number; // 例: 1920
  mute: boolean;          // true: ミュート
  volume: number;         // 0..100
}

interface TickClockState {
  playing: boolean;
  bpm: number;
  originTimeUs: number;
}
```

### モックデータ方針（シーケンス）
- デバイスからのシーケンス取得が未確立の間、円周上を移動するノート群をモックで生成。
- モック仕様は `panel-sequencer.md` に詳細化。

### 非機能要件
- パフォーマンス: 60fps 目標（SVG/Canvasは`requestAnimationFrame`、最小再レンダ）。
- 安定性: 接続断時の復帰 UI を用意（再接続/接続ページ遷移）。
- i18n: 当面日本語固定。ラベルは後置換可能に集約。

### 依存/外部設計
- Next.js App Router, shadcn/ui, Tailwind, Radix UI。
- コアサービス: Mesh, CommandDispatcher, AppStateSync, DataTransfer（将来拡張）。


