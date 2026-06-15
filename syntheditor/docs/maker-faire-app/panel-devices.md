## デバイスパネル 仕様

`mock.png` 下段のデバイス一覧。接続中デバイスを横並びのカードで表示し、クリックで Popover を開く。

### カード表示
- コンポーネント: `DeviceCard`（新規）
  - レイアウト: `Card` 内に縦長長方形（本体色）と中央円（LED色）のSVG。
  - 下に楽器名（現在の選択トラックに紐づく表示名）。
  - ホバー時は `ring-2 ring-primary`。

### Popover 内容
- 選択トラック: `Select`（1..8）。変更で `currentTracksState` を更新。
- 楽器名: 将来的に `Select`（初期は読み取り専用またはダミー）。
- マスターボリューム: `Slider`（当面 no-op）。
- MAC アドレス: 読み取り専用テキスト。

### 同期
- トラック変更は `currentTracksState: Map<string, number>` を書き換え、AppState 同期。
- 表示名はトラック情報（`trackStates` または TrackDetail が提供する displayName）を参照。未接続時はフォールバック名。

### レイアウト
- 横スクロール可能な `ScrollArea` にカードを水平配置（`gap-4`）。
- カード幅は `w-56` 目安。`mock.png` の比率に合わせる。

### アクセシビリティ
- カードは `role=button`、`aria-haspopup=dialog`。Popover は `aria-modal` 適用。


