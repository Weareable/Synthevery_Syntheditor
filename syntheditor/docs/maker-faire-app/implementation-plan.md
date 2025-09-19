## 実装計画（shadcn/ui 新規実装方針）

### フェーズ構成

#### Phase 1: 骨子と同期の最小実装
- ルート `/maker-faire` を追加し、4パネルレイアウトを作成。
- `SidebarNav` を実装（Dashboard 以外はリンクのみ）。
- `TransportBar` を実装し、`PlayerSyncStates` と接続（BPM/Play/Stop/M/Q/Rec）。

#### Phase 2: シーケンス可視化（モック）
- `SequencerViz`（SVG）を実装。
- モックトラック/ノートを生成し、BPMで角速度が変わるアニメーションを実装。

#### Phase 3: トラック UI
- LIVE: `TrackGrid` を実装（ミュート切替、追加ボタンは no-op）。
- MIX: `VerticalSlider` + `MixerFaders` を実装（音量0..100）。
- EDIT: `TrackEditor` を実装（トラック選択、loopLengthTick/volume/mute 編集、楽器はダミー）。

#### Phase 4: デバイス UI
- `DeviceCard` と `DevicePopover` を実装。`currentTracksState` を更新可能に。
- マスターボリュームはUIのみ（no-op）。

#### Phase 5: 仕上げ
- アクセシビリティ/キーボード操作の点検。
- レスポンシブ対応/テーマ微調整/微アニメ最適化。

### 新規ファイル構成（予定）
```
app/(main)/maker-faire/page.tsx                // 4パネル統合ページ
components/maker-faire/SidebarNav.tsx          // ナビ
components/maker-faire/TransportBar.tsx        // トランスポート
components/maker-faire/SequencerViz.tsx        // 円環可視化
components/maker-faire/TrackGrid.tsx           // LIVE
components/maker-faire/MixerFaders.tsx         // MIX
components/maker-faire/VerticalSlider.tsx      // 共通縦スライダ
components/maker-faire/TrackEditor.tsx         // EDIT
components/maker-faire/DeviceCard.tsx          // デバイス表示
components/maker-faire/DevicePopover.tsx       // デバイス詳細
```

### 仕様のマッピング
- 単位変換: `loopLengthTick = steps(16th) * 120`。入力バリデーション/クリップ。
- 同期 API: `useSynthevery().playerSyncStates` と `useDeviceControl()` を利用。

### リスク/代替
- シーケンス取得未確立 → モック継続。将来 DataTransfer/API 合流時に `SequencerViz` のデータソースを切替。
- マスターボリューム API 未提供 → UIのみ、実装後に接続。


