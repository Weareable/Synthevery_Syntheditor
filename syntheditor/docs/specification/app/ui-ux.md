# Syntheveryアプリケーション UI/UX仕様

## 概要

SyntheveryアプリケーションのUI/UXは、直感的で使いやすい音楽制作インターフェースを提供します。ダークテーマをベースとし、リアルタイムでの状態表示と視覚的フィードバックを重視したデザインです。

## デザインシステム

### カラーパレット

#### プライマリカラー
```css
/* ダークテーマ */
--background: oklch(0.28 0 0);           /* 背景色 */
--foreground: oklch(0.985 0 0);          /* 前景色 */
--card: oklch(0.3092 0 0);               /* カード背景 */
--card-foreground: oklch(0.985 0 0);     /* カード前景 */
--primary: oklch(0.922 0 0);             /* プライマリ色 */
--primary-foreground: oklch(0.922 0 0);  /* プライマリ前景 */
--secondary: oklch(0.922 0 0 / 40%);     /* セカンダリ色 */
--muted: oklch(0.269 0 0);               /* ミュート色 */
--muted-foreground: oklch(0.600 0 0);    /* ミュート前景 */
--accent: oklch(0.269 0 0);              /* アクセント色 */
--destructive: oklch(0.704 0.191 22.216); /* 破壊的アクション */
--border: oklch(1 0 0 / 10%);            /* ボーダー色 */
--input: oklch(1 0 0 / 15%);             /* 入力フィールド */
--ring: oklch(0.556 0 0);                /* フォーカスリング */
```

#### 状態カラー
```css
/* 接続状態 */
--connected: oklch(0.488 0.243 264.376);  /* 接続済み（青） */
--disconnected: oklch(0.704 0.191 22.216); /* 未接続（赤） */
--connecting: oklch(0.769 0.188 70.08);   /* 接続中（黄） */

/* 演奏状態 */
--playing: oklch(0.696 0.17 162.48);      /* 再生中（緑） */
--paused: oklch(0.600 0 0);               /* 一時停止（グレー） */
--stopped: oklch(0.704 0.191 22.216);     /* 停止（赤） */
```

### タイポグラフィ

#### フォントファミリー
```css
font-family: var(--font-montserrat), system-ui, sans-serif;
```

#### フォントサイズ
```css
/* 見出し */
--text-4xl: 2.25rem;    /* 36px */
--text-2xl: 1.5rem;     /* 24px */
--text-xl: 1.25rem;     /* 20px */
--text-lg: 1.125rem;    /* 18px */

/* 本文 */
--text-base: 1rem;      /* 16px */
--text-sm: 0.875rem;    /* 14px */
--text-xs: 0.75rem;     /* 12px */
```

#### フォントウェイト
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### スペーシング

#### 間隔システム
```css
--space-1: 0.25rem;     /* 4px */
--space-2: 0.5rem;      /* 8px */
--space-3: 0.75rem;     /* 12px */
--space-4: 1rem;        /* 16px */
--space-6: 1.5rem;      /* 24px */
--space-8: 2rem;        /* 32px */
--space-12: 3rem;       /* 48px */
--space-16: 4rem;       /* 64px */
```

#### ギャップ
```css
--gap-1: 0.25rem;       /* 4px */
--gap-2: 0.5rem;        /* 8px */
--gap-4: 1rem;          /* 16px */
--gap-6: 1.5rem;        /* 24px */
--gap-8: 2rem;          /* 32px */
```

### ボーダー・シャドウ

#### ボーダー
```css
--radius: 0.625rem;     /* 10px */
--border-width: 1px;
--border-style: solid;
```

#### シャドウ
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
```

## レイアウト設計

### メインレイアウト

#### デスクトップレイアウト
```
┌─────────────────────────────────────────────────────────────┐
│                    Syntheditor                              │
├─────────┬─────────────────────────┬─────────────────────────┤
│         │                         │                         │
│  垂直   │      メインコンテンツ     │    デバイスステータス     │
│ ナビゲーション │                         │                         │
│         │                         │                         │
│         │                         │                         │
├─────────┴─────────────────────────┴─────────────────────────┤
│                メディアコントロールバー                      │
└─────────────────────────────────────────────────────────────┘
```

#### レスポンシブ対応
- **デスクトップ**: 3カラムレイアウト
- **タブレット**: 2カラムレイアウト
- **モバイル**: 1カラムレイアウト

### コンポーネントレイアウト

#### パネルコンポーネント
```typescript
interface PanelProps {
    className?: string;
    children: React.ReactNode;
    variant?: "default" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
}
```

#### ボタンコンポーネント
```typescript
interface ButtonProps {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    disabled?: boolean;
    children: React.ReactNode;
    onClick?: () => void;
}
```

## コンポーネント仕様

### 1. ナビゲーションコンポーネント

#### VerticalNavigationBar
```typescript
interface NavigationItem {
    href: string;
    icon: string;
    label: string;
}

const navigationItems: NavigationItem[] = [
    { href: '/player/synthesizer', icon: '🎹', label: 'シンセサイザー' },
    { href: '/player/drums', icon: '🥁', label: 'ドラムス' },
    { href: '/player/bass', icon: '🎸', label: 'ベース' },
    { href: '/player/sampler', icon: '🎵', label: 'サンプラー' }
];
```

**デザイン仕様**:
- **サイズ**: 40px × 40px
- **間隔**: 8px
- **アクティブ状態**: 青背景、白文字
- **ホバー状態**: グレー背景

### 2. メディアコントロールコンポーネント

#### MediaControlBar
```typescript
interface MediaControlBarProps {
    // クオンタイザー
    quantizerState: boolean;
    onQuantizerChange: (enabled: boolean) => void;
    
    // メトロノーム
    metronomeState: boolean;
    onMetronomeChange: (enabled: boolean) => void;
    
    // BPM
    bpm: number;
    onBpmChange: (bpm: number) => void;
    
    // 再生制御
    playingState: boolean;
    onPlayingChange: (playing: boolean) => void;
    onStop: () => void;
    
    // 録音
    recordingState: boolean;
    onRecordingChange: (recording: boolean) => void;
}
```

**デザイン仕様**:
- **レイアウト**: 水平配置、中央揃え
- **セクション**: 3つのセクション（左・中央・右）
- **区切り**: 垂直区切り線
- **ボタンサイズ**: 32px × 32px

#### BPMInput
```typescript
interface BPMInputProps {
    value: number;
    onBpmChange: (bpm: number) => void;
    min?: number;        // デフォルト: 40
    max?: number;        // デフォルト: 300
    className?: string;
}
```

**デザイン仕様**:
- **入力方式**: 数値入力 + 増減ボタン
- **デバウンス**: 500ms
- **範囲**: 40-300 BPM
- **表示**: 3桁固定幅

### 3. デバイスステータスコンポーネント

#### DeviceStatusPanel
```typescript
interface DeviceStatusPanelProps {
    connectedDevices: string[];
    connectedPeers: string[];
    connectionStatus: 'connected' | 'disconnected' | 'connecting';
}
```

**デザイン仕様**:
- **レイアウト**: 垂直配置、中央揃え
- **アイコン**: 大きなロボットアイコン
- **状態表示**: 色分けされたテキスト
- **デバイスリスト**: モノスペースフォント

### 4. プレイヤーコンポーネント

#### SynthesizerPage
```typescript
interface SynthesizerPageProps {
    // オクターブ選択
    selectedOctave: number;
    onOctaveChange: (octave: number) => void;
    
    // ミュート状態
    isMuted: boolean;
    onMuteChange: (muted: boolean) => void;
    
    // デバイス状態
    connectedDevices: string[];
}
```

**デザイン仕様**:
- **レイアウト**: 中央配置
- **ピアノキーボード**: 12音階表示
- **オクターブ選択**: ボタングループ
- **ミュート制御**: トグルボタン

#### DrumsPage
```typescript
interface DrumsPageProps {
    // ドラムパッド
    drumPads: DrumPadState[];
    onDrumPadClick: (padIndex: number) => void;
    
    // ミキシング
    isMuted: boolean;
    isSolo: boolean;
    onMuteChange: (muted: boolean) => void;
    onSoloChange: (solo: boolean) => void;
}
```

**デザイン仕様**:
- **ドラムパッド**: 4×2グリッド
- **パッドサイズ**: 80px × 80px
- **アイコン**: 各ドラムのアイコン
- **状態表示**: アクティブ/非アクティブ

### 5. UI基本コンポーネント

#### Panel
```typescript
interface PanelProps {
    className?: string;
    children: React.ReactNode;
    variant?: "default" | "outline" | "ghost";
}
```

**デザイン仕様**:
- **背景**: カード背景色
- **ボーダー**: 1px、グレー
- **角丸**: 10px
- **パディング**: 16px

#### ToggleButton
```typescript
interface ToggleButtonProps {
    pressed: boolean;
    onPressedChange: (pressed: boolean) => void;
    size?: "default" | "sm" | "lg";
    disabled?: boolean;
    children: React.ReactNode;
}
```

**デザイン仕様**:
- **サイズ**: 32px × 32px（デフォルト）
- **状態**: 押下/非押下
- **色**: アクティブ時は青背景
- **トランジション**: 0.2s

#### OneshotButton
```typescript
interface OneshotButtonProps {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    onClick?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}
```

**デザイン仕様**:
- **バリアント**: 複数のスタイルバリアント
- **サイズ**: 3つのサイズバリエーション
- **ホバー効果**: 色の変化
- **アクティブ効果**: 押下時の視覚的フィードバック

## インタラクション設計

### 1. タッチ・マウス操作

#### タッチ操作
- **タップ**: ボタンクリック、選択
- **長押し**: 詳細メニュー、削除
- **スワイプ**: ページ遷移、スクロール
- **ピンチ**: ズーム（将来機能）

#### マウス操作
- **クリック**: ボタン操作、選択
- **ダブルクリック**: 詳細表示
- **右クリック**: コンテキストメニュー
- **ドラッグ**: ドラッグ&ドロップ（将来機能）

### 2. キーボード操作

#### ナビゲーション
- **Tab**: フォーカス移動
- **Enter**: 決定
- **Escape**: キャンセル
- **Space**: トグル

#### ショートカット
- **Ctrl+S**: 保存
- **Ctrl+Z**: 元に戻す
- **Ctrl+Y**: やり直し
- **Space**: 再生/一時停止

### 3. アクセシビリティ

#### スクリーンリーダー対応
- **aria-label**: ボタンの説明
- **aria-describedby**: 詳細説明
- **aria-expanded**: 展開状態
- **aria-pressed**: 押下状態

#### キーボードナビゲーション
- **フォーカス表示**: 明確なフォーカスインジケーター
- **論理的な順序**: タブ順序の最適化
- **スキップリンク**: メインコンテンツへの直接移動

## アニメーション・トランジション

### 1. トランジション

#### 基本トランジション
```css
/* 色の変化 */
transition: color 0.2s ease-in-out;

/* 背景色の変化 */
transition: background-color 0.2s ease-in-out;

/* 変形 */
transition: transform 0.2s ease-in-out;
```

#### 状態変化
- **ホバー**: 0.2s ease-in-out
- **アクティブ**: 0.1s ease-in-out
- **フォーカス**: 0.2s ease-in-out

### 2. アニメーション

#### ローディングアニメーション
```css
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.spinner {
    animation: spin 1s linear infinite;
}
```

#### フェードイン/アウト
```css
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.fade-in {
    animation: fadeIn 0.3s ease-in-out;
}
```

## レスポンシブデザイン

### 1. ブレークポイント

```css
/* モバイル */
@media (max-width: 768px) {
    /* モバイル用スタイル */
}

/* タブレット */
@media (min-width: 769px) and (max-width: 1024px) {
    /* タブレット用スタイル */
}

/* デスクトップ */
@media (min-width: 1025px) {
    /* デスクトップ用スタイル */
}
```

### 2. レイアウト調整

#### モバイル
- **1カラムレイアウト**: 縦並び
- **大きなタッチターゲット**: 44px以上
- **簡易化されたUI**: 重要な機能のみ表示

#### タブレット
- **2カラムレイアウト**: 適度な情報密度
- **タッチ最適化**: 指での操作に適したサイズ
- **ハイブリッド操作**: タッチとマウスの両方に対応

#### デスクトップ
- **3カラムレイアウト**: 最大の情報密度
- **マウス最適化**: ホバー効果、右クリックメニュー
- **キーボードショートカット**: 効率的な操作

## パフォーマンス最適化

### 1. レンダリング最適化

#### React最適化
- **メモ化**: useCallback, useMemoの活用
- **仮想化**: 大量データの仮想化
- **遅延読み込み**: 動的インポート

#### CSS最適化
- **GPU加速**: transform, opacityの活用
- **レイヤー最適化**: will-changeプロパティ
- **アニメーション最適化**: requestAnimationFrame

### 2. ネットワーク最適化

#### アセット最適化
- **画像最適化**: WebP形式、適切なサイズ
- **フォント最適化**: 必要な文字のみ読み込み
- **コード分割**: 必要な機能のみ読み込み

#### キャッシュ戦略
- **ブラウザキャッシュ**: 静的アセットのキャッシュ
- **Service Worker**: オフライン対応
- **CDN**: 高速配信

## 将来の改善計画

### 1. UI/UX改善
- **ダークモード/ライトモード**: テーマ切り替え
- **カスタムテーマ**: ユーザーカスタマイズ
- **アニメーション強化**: より豊富なアニメーション

### 2. アクセシビリティ改善
- **WCAG 2.1準拠**: アクセシビリティ標準準拠
- **音声ナビゲーション**: 音声による操作
- **ハイコントラスト**: 視覚障害者対応

### 3. モバイル最適化
- **PWA対応**: ネイティブアプリ化
- **オフライン機能**: ネットワーク不要での操作
- **プッシュ通知**: リアルタイム通知 