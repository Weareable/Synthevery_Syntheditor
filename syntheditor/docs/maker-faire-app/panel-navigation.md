## ナビゲーションパネル 仕様

### 目的
`mock.png` 左サイドのメニューを shadcn/ui ベースで実装し、Dashboard / Instruments / Chord / Devices / Settings を表示。まず Dashboard を実装し、他は既存テスト/既存ルートへリンク。

### 構成
- コンポーネント: `SidebarNav`
  - ベース: `ScrollArea` + `nav` + `Button`(variant="ghost")
  - 選択状態: `aria-current="page"`、色は `text-primary`/`bg-accent` 等で強調
  - アイコンは将来のFigma資産を想定。初期版はテキストのみ。

### 動作
- クリックで対象ページへ push。`/maker-faire` を Dashboard とし、他は既存ページ（Instruments/Chord/Devices/Settings）は当面ダミー/代替。
- キーボード: `Tab` で移動、`Enter/Space` で遷移。

### スタイル
- 幅: `w-56` 固定（`mock.png` の比率に合わせる）。
- 余白: アイテムは `py-2 px-4`、区切りは `Separator` を必要に応じて。
- レスポンシブ: 768px 未満では隠し、ハンバーガーで開閉する簡易対応（将来）。

### アクセシビリティ
- `aria-label="Main navigation"` を nav に付与。
- 現在地は `aria-current` で通知。

### ルーティング例
```ts
const links = [
  { href: '/maker-faire', label: 'Dashboard' },
  { href: '/maker-faire/instruments', label: 'Instruments' },
  { href: '/maker-faire/chord', label: 'Chord' },
  { href: '/maker-faire/devices', label: 'Devices' },
  { href: '/maker-faire/settings', label: 'Settings' },
];
```


