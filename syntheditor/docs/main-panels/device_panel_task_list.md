# デバイスパネル実装タスクリスト

## タスク概要

デバイスパネルの実装を段階的に進めるための詳細タスクリストです。各タスクは独立して実装・テスト可能な単位で分割されています。

## Phase 1: 基礎コンポーネント

### 🎯 Task 1.1: DeviceIcon コンポーネント作成

**ファイル**: `components/device/DeviceIcon.tsx`

**目標**: デバイスの視覚的表現の基盤コンポーネント

**仕様**:
- 正方形ベースのアイコン
- 同心円デザイン（外枠 + 内部円）
- プロップスで色・サイズをカスタマイズ可能
- LED状態の表現（点灯・点滅・消灯）

**実装内容**:
```typescript
interface DeviceIconProps {
  bodyColor?: string;           // デバイス本体色
  ledColor?: string;            // LED色
  ledStatus?: 'on' | 'off' | 'blink';  // LED状態
  size?: 'sm' | 'md' | 'lg';    // サイズ
  className?: string;
}
```

**完了条件**:
- [ ] プロップス通りの色で表示される
- [ ] LEDアニメーション（点滅）が動作する
- [ ] サイズバリエーションが正しく適用される
- [ ] アクセシビリティ属性が設定されている

---

### 🎯 Task 1.2: useDeviceOrder フック作成

**ファイル**: `hooks/useDeviceOrder.tsx`

**目標**: デバイス接続順序とアルファベットID管理

**仕様**:
- `mesh.getDeviceOrder()`のReact統合
- デバイス接続/切断の動的更新
- アルファベットID生成（A, B, C...）

**実装内容**:
```typescript
interface UseDeviceOrderReturn {
  deviceOrder: P2PMacAddress[];
  getDeviceAlphabetId: (deviceAddr: P2PMacAddress) => string;
  getDeviceIndex: (deviceAddr: P2PMacAddress) => number;
  isOrderReady: boolean;
}
```

**完了条件**:
- [ ] デバイス接続順序が正しく取得される
- [ ] デバイス接続/切断時に状態が更新される
- [ ] アルファベットIDが正しく生成される（A, B, C...）
- [ ] エラーハンドリングが実装されている

---

## Phase 2: デバイスカード

### 🎯 Task 2.1: DeviceCard コンポーネント作成

**ファイル**: `components/device/DeviceCard.tsx`

**目標**: 個別デバイス情報の包括的表示

**仕様**:
- DeviceIcon表示
- デバイスID（アルファベット）表示
- 現在のトラック情報表示
- 将来のナビゲーション矢印用スペース確保

**実装内容**:
```typescript
interface DeviceCardProps {
  deviceAddress: P2PMacAddress;
  alphabetId: string;
  currentTrack: {
    index: number;
    detail: TrackDetail;
  };
  bodyColor?: string;
  ledColor?: string;
  ledStatus?: 'on' | 'off' | 'blink';
  className?: string;
}
```

**完了条件**:
- [ ] デバイス情報が正しく表示される
- [ ] トラック情報（名前・アイコン）が表示される
- [ ] 既存TrackCardと統一感のあるデザイン
- [ ] レスポンシブ対応

---

### 🎯 Task 2.2: useDevicePositions フック作成

**ファイル**: `hooks/useDevicePositions.tsx`

**目標**: デバイス装着位置の状態管理

**仕様**:
- `playerSyncStates.devicePositions`との連携
- 装着位置の取得・更新
- 位置名のマッピング

**実装内容**:
```typescript
enum DevicePosition {
  HANDHELD = 0,
  LEFT_ARM = 1,
  RIGHT_ARM = 2,
  LEFT_LEG = 3,
  RIGHT_LEG = 4
}

interface UseDevicePositionsReturn {
  devicePositions: Map<string, DevicePosition>;
  getDevicePosition: (deviceAddr: P2PMacAddress) => DevicePosition;
  getPositionLabel: (position: DevicePosition) => string;
  getWearableDevices: () => Array<{address: P2PMacAddress, position: DevicePosition}>;
}
```

**完了条件**:
- [ ] 装着位置が正しく取得される
- [ ] 装着位置の変更が反映される
- [ ] 手持ちデバイスが除外される
- [ ] 位置ラベルが正しく返される

---

## Phase 3: レイアウト統合

### 🎯 Task 3.1: DevicePanel コンポーネント作成

**ファイル**: `components/device/DevicePanel.tsx`

**目標**: メインパネルのレイアウトと状態管理統合

**仕様**:
- 左右分割レイアウト
- デバイスカードリスト（1列/2列切り替え）
- データ取得の統合管理
- ローディング・エラー状態の処理

**実装内容**:
```typescript
interface DevicePanelProps {
  layoutMode?: '1col' | '2col' | 'auto';
  className?: string;
}
```

**完了条件**:
- [ ] 接続デバイスが正しく表示される
- [ ] レスポンシブレイアウトが動作する
- [ ] ローディング状態が表示される
- [ ] デバイス未接続時の表示が適切

---

### 🎯 Task 3.2: HumanBodyDisplay コンポーネント作成

**ファイル**: `components/device/HumanBodyDisplay.tsx`

**目標**: 人体アイコンと装着位置の表示

**仕様**:
- シンプルな人体アイコン
- 装着位置マーカー（左腕、右腕、左足、右足）
- 装着済みデバイスのみ表示
- デバイスアイコン + ID表示

**実装内容**:
```typescript
interface HumanBodyDisplayProps {
  wearableDevices: Array<{
    address: P2PMacAddress;
    position: DevicePosition;
    alphabetId: string;
    bodyColor?: string;
  }>;
  className?: string;
}
```

**完了条件**:
- [ ] 人体アイコンが表示される
- [ ] 装着位置に正しくデバイスが配置される
- [ ] 手持ちデバイスが表示されない
- [ ] デバイスIDが読みやすく表示される

---

## Phase 4: ページ統合

### 🎯 Task 4.1: デバイスパネルページ作成

**ファイル**: `app/(main)/player/devices/page.tsx`

**目標**: アプリケーションへの統合

**仕様**:
- DevicePanelコンポーネントの統合
- ページタイトル・メタデータ設定
- エラーバウンダリ設定

**実装内容**:
```typescript
export default function DevicesPage() {
  return (
    <div className="w-full h-full">
      <DevicePanel />
    </div>
  );
}
```

**完了条件**:
- [ ] `/player/devices`でアクセス可能
- [ ] DevicePanelが正しく表示される
- [ ] ページタイトルが設定されている
- [ ] エラー時の表示が適切

---

### 🎯 Task 4.2: ナビゲーション統合

**ファイル**: `components/VerticalNavigationBar.tsx`

**目標**: ナビゲーションバーにデバイスパネル追加

**仕様**:
- 新しいナビゲーション項目追加
- 適切なアイコン設定
- アクティブ状態の表示

**実装内容**:
```typescript
const navigationItems = [
  // 既存項目...
  { href: '/player/devices', icon: '📱', label: 'デバイス管理' }
];
```

**完了条件**:
- [ ] ナビゲーション項目が追加される
- [ ] アイコンが適切に表示される
- [ ] アクティブ状態が正しく動作する
- [ ] レスポンシブ対応

---

## Phase 5: 品質保証・拡張

### 🎯 Task 5.1: useDeviceColors フック作成

**ファイル**: `hooks/useDeviceColors.tsx`

**目標**: 将来拡張用のデバイス色管理

**仕様**:
- 現時点では固定色・ランダム色
- 将来のDeviceColorManager統合準備
- デバイス別色の一意性確保

**実装内容**:
```typescript
interface UseDeviceColorsReturn {
  getDeviceBodyColor: (deviceAddr: P2PMacAddress) => string;
  getDeviceLedColor: (deviceAddr: P2PMacAddress) => string;
  generateDeviceColors: (deviceAddr: P2PMacAddress) => void;
}
```

**完了条件**:
- [ ] デバイス別に一意の色が生成される
- [ ] 色の視認性が確保されている
- [ ] 将来拡張に対応した設計
- [ ] パフォーマンスが最適化されている

---

### 🎯 Task 5.2: コンポーネントindex作成

**ファイル**: `components/device/index.ts`

**目標**: コンポーネントのエクスポート整理

**実装内容**:
```typescript
export { DeviceIcon } from './DeviceIcon';
export { DeviceCard } from './DeviceCard';
export { HumanBodyDisplay } from './HumanBodyDisplay';
export { DevicePanel } from './DevicePanel';

export type {
  DeviceIconProps,
  DeviceCardProps,
  HumanBodyDisplayProps,
  DevicePanelProps
} from './types';
```

**完了条件**:
- [ ] 全コンポーネントがエクスポートされる
- [ ] 型定義がエクスポートされる
- [ ] インポートが簡潔になる

---

### 🎯 Task 5.3: テスト・ドキュメント

**目標**: 品質保証とドキュメント整備

**実装内容**:
- 各コンポーネントの単体テスト
- 統合テストシナリオ
- Storybookストーリー作成
- README更新

**完了条件**:
- [ ] 主要コンポーネントのテストが作成される
- [ ] デバイス接続/切断のテストが通る
- [ ] Storybookでコンポーネント確認可能
- [ ] 実装ドキュメントが更新される

---

## 優先順位とマイルストーン

### 🚀 Milestone 1: 基本表示（Tasks 1.1, 1.2, 2.1）
**目標**: デバイスカードの基本表示
**期間**: 2-3日
**成果物**: デバイスアイコン・ID・トラック情報の表示

### 🚀 Milestone 2: パネル統合（Tasks 2.2, 3.1）
**目標**: 完全なパネルレイアウト
**期間**: 2-3日  
**成果物**: 左側デバイスリスト表示

### 🚀 Milestone 3: 装着位置表示（Task 3.2）
**目標**: 人体アイコン表示
**期間**: 2-3日
**成果物**: 右側人体・装着位置表示

### 🚀 Milestone 4: アプリ統合（Tasks 4.1, 4.2）
**目標**: 完全なアプリ統合
**期間**: 1-2日
**成果物**: ナビゲーション・ページ統合

### 🚀 Milestone 5: 品質向上（Tasks 5.1, 5.2, 5.3）
**目標**: 品質保証・将来拡張準備
**期間**: 2-3日
**成果物**: テスト・ドキュメント・拡張準備

---

## 注意事項・リスク

### ⚠️ 技術リスク
1. **デバイス接続順序**: `mesh.getDeviceOrder()`の動作確認が必要
2. **状態同期**: 高頻度更新時のパフォーマンス
3. **レスポンシブ**: 様々な画面サイズでの表示確認

### ⚠️ 実装リスク  
1. **色管理**: デバイス色取得機能の未実装
2. **装着位置**: 実際のデバイス位置データの動作確認
3. **トラック情報**: trackConfigとの連携確認

### 🛡️ 軽減策
1. **段階的実装**: 各フェーズでの動作確認
2. **モック対応**: 実機なしでも開発可能な設計
3. **エラーハンドリング**: 想定外状況への対応

---

*このタスクリストは実装進捗に応じて更新され、完了タスクにチェックマークが付けられます。*
