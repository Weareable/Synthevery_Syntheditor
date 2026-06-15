## シーケンサーパネル 仕様

`mock.png` 上段左の領域。左側に円環シーケンス可視化、右側にメディアコントロール（BPM/再生/録音/メトロノーム/クォンタイザ）。

### 構成
- 可視化: `SequencerViz`（新規）
  - SVG（初版）/Canvas（将来切替可）。
  - レイヤ: 背景円/ノート/再生位相ライン（破線）/トラック色。
  - 円は右端で接するように半径を配置。最大半径はパネル幅に収まるよう計算。
- コントロール: `TransportBar`（新規）
  - shadcn: `Button`, `Toggle`, `Input`, `Separator`。
  - 要素: Play/Pause, Stop, Record, M(メトロノーム), Q(クオンタイザ), BPM 表示・編集。

### データ連携
- 読み取り
  - `tickClockState` から `playing`, `bpm`。
  - `trackStates`（各トラックの `loopLengthTick`）。
- 書き込み
  - `setPlayingState('play'|'pause'|'stop')`、`setBpm(number)`。
  - `metronomeState`, `quantizerState`, `recorderState` の更新は AppState 経由。

### 角速度・座標系
- 基準: 1小節 = 1920 tick、16分 = 120 tick。
- 各トラックの円は「周速度一定」を満たす。
  - 角速度 ω は BPM のみから決まり、`ω = 2π / (loopLengthBeat) / (60/BPM)` を満たす等価表現とし、実装は「位相を時間から直接計算」する。
  - ループ長が長い円ほど半径が大きい。ノートの移動は同じ速度で見える。
- 位相0は円の右端接点。水平破線は位相πを示すガイド。

### ノート描画（モック仕様）
- モック入力型
```ts
interface MockNote { tick: number; color: string; }
type MockTrack = { color: string; loopLengthTick: number; notes: MockNote[] };
```
- 配置
  - `angle = 2π * (tick % loop) / loop` で極座標から算出。
  - ノートは半径上の小円（`r=6~8px`）。
  - トラック色は `color` を基本に、ライト/ダークでコントラスト調整。

### アニメーション
- `requestAnimationFrame` で毎フレーム描画。位相は現在時刻と `originTimeUs`/`BPM` から導出（AppState 未提供時はローカルタイマー）。
- 再生停止に同期して開始/停止。

### アクセシビリティ
- コントロールは全てフォーカス可能。`aria-pressed`/`aria-label` を付与。
- BPM 入力は `type=number` 相当の実装とし、上下キーで微調整。

### スタイル
- 左右2カラム: 可視化は比率 2:1、コントロールは中央寄せ。
- 余白は `p-4`、区切りに `Separator`。


