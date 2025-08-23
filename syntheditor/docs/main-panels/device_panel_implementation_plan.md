# デバイスパネル実装計画書

## 概要

この文書は、[デバイスパネル仕様書](./spec_device_panel.md)に基づいたデバイスパネルの具体的な実装計画とタスクリストを定義します。

## 実装方針

### アーキテクチャ設計

1. **既存パターンの活用**: `TrackSelectPanel`と同様のパネル構造を採用
2. **状態管理の統一**: `playerSyncStates`と`useAppState`パターンを活用
3. **段階的実装**: 拡張性を重視した段階的なコンポーネント開発
4. **TypeScript優先**: 型安全性を確保した開発

### データフロー設計

```typescript
// 必要な状態データソース
interface DevicePanelDataSources {
  connectedDevices: P2PMacAddress[];     // mesh.getConnectedDevices()
  deviceOrder: P2PMacAddress[];          // mesh.getDeviceOrder()
  currentTracks: Map<string, number>;    // playerSyncStates.currentTracksState
  devicePositions: Map<string, number>;  // playerSyncStates.devicePositions
  trackDetails: TrackDetail[];           // useTrackConfig()
}
```

## コンポーネント設計

### ファイル構成

```
components/device/
├── DeviceIcon.tsx           # デバイスアイコン（色・LED状態表示）
├── DeviceCard.tsx           # デバイスカード（ID・トラック情報・矢印）
├── HumanBodyDisplay.tsx     # 人体アイコン表示
├── DevicePanel.tsx          # メインパネル
└── index.ts                # エクスポート定義

hooks/
├── useDeviceOrder.tsx       # デバイス接続順序管理
├── useDeviceColors.tsx      # デバイス色情報管理
└── useDevicePositions.tsx   # デバイス装着位置管理

app/(main)/player/devices/
└── page.tsx                # デバイスパネルページ
```

### コンポーネント階層

```
DevicePanel
├── DeviceCardList (左側領域)
│   ├── DeviceCard[]
│   │   ├── DeviceIcon
│   │   ├── DeviceID (A, B, C...)
│   │   ├── TrackInfo
│   │   │   ├── TrackName
│   │   │   └── InstrumentIcon
│   │   └── NavigationArrows
│   └── EmptyDeviceSlots (デバイス未接続時)
└── HumanBodyDisplay (右側領域)
    ├── HumanBodyIcon
    └── DevicePositionMarker[]
        ├── DeviceIcon
        └── DeviceID
```

## 実装フェーズ

### Phase 1: 基礎コンポーネント

**目標**: デバイスの基本的な視覚表現

1. **DeviceIcon コンポーネント**
   - デバイスの色とLED状態を表現
   - 正方形ベース、同心円デザイン
   - プロップスで色・状態をカスタマイズ可能

2. **useDeviceOrder フック**
   - `mesh.getDeviceOrder()`のReact統合
   - デバイス接続順序の状態管理
   - アルファベットID生成ロジック

### Phase 2: デバイスカード

**目標**: 個別デバイス情報の表示

3. **DeviceCard コンポーネント**
   - DeviceIcon + デバイスID + トラック情報
   - トラック切り替え矢印（将来機能）
   - 既存TrackCardのデザイン言語を踏襲

4. **useDevicePositions フック**
   - `playerSyncStates.devicePositions`の活用
   - 装着位置の状態管理

### Phase 3: レイアウト統合

**目標**: 完全なパネルレイアウト

5. **DevicePanel コンポーネント**
   - 左右分割レイアウト
   - デバイスカードリスト（1列/2列対応）
   - レスポンシブ対応

6. **HumanBodyDisplay コンポーネント**
   - 人体アイコン表示
   - 装着位置マーカー
   - 装着済みデバイスのみ表示

### Phase 4: ページ統合

**目標**: アプリケーションへの統合

7. **デバイスパネルページ**
   - `/player/devices`ルート作成
   - ナビゲーションバー統合

8. **useDeviceColors フック**
   - 将来拡張用のデバイス色管理
   - 現時点では固定色/ランダム色

## 技術仕様詳細

### デバイスID割り当てロジック

```typescript
/**
 * デバイスの接続順序に基づいてアルファベットIDを生成
 */
const getDeviceAlphabetId = (
  deviceOrder: P2PMacAddress[], 
  deviceAddr: P2PMacAddress
): string => {
  const index = deviceOrder.findIndex(addr => 
    getAddressString(addr) === getAddressString(deviceAddr)
  );
  return index >= 0 ? String.fromCharCode(65 + index) : '?';
}
```

### トラック情報取得

```typescript
/**
 * デバイスの現在選択トラック情報を取得
 */
const getDeviceTrackInfo = (
  deviceAddr: P2PMacAddress,
  currentTracks: Map<string, number>,
  trackDetails: TrackDetail[]
) => {
  const deviceKey = getAddressString(deviceAddr);
  const trackIndex = currentTracks.get(deviceKey) ?? 0;
  return {
    trackIndex,
    trackDetail: trackDetails[trackIndex]
  };
}
```

### レスポンシブレイアウト

```css
/* デバイスカードグリッド */
.device-cards {
  display: grid;
  gap: 0.5rem;
  padding: 0.5rem;
}

/* 1列レイアウト（デフォルト） */
.device-cards-1col {
  grid-template-columns: 1fr;
}

/* 2列レイアウト（画面幅 >= 768px） */
@media (min-width: 768px) {
  .device-cards-2col {
    grid-template-columns: 1fr 1fr;
  }
}
```

### 装着位置マッピング

```typescript
enum DevicePosition {
  HANDHELD = 0,    // 手持ち（人体アイコンに非表示）
  LEFT_ARM = 1,    // 左腕
  RIGHT_ARM = 2,   // 右腕  
  LEFT_LEG = 3,    // 左足
  RIGHT_LEG = 4    // 右足
}

const POSITION_LABELS: Record<DevicePosition, string> = {
  [DevicePosition.HANDHELD]: '手持ち',
  [DevicePosition.LEFT_ARM]: '左腕',
  [DevicePosition.RIGHT_ARM]: '右腕',
  [DevicePosition.LEFT_LEG]: '左足',
  [DevicePosition.RIGHT_LEG]: '右足'
};
```

## 品質保証

### テスト戦略

1. **単体テスト**: 各コンポーネントの独立テスト
2. **統合テスト**: デバイス接続/切断のシナリオテスト
3. **視覚テスト**: Storybookでのコンポーネント表示確認

### パフォーマンス考慮

1. **memo化**: 高頻度更新コンポーネントのReact.memo適用
2. **状態最適化**: 不要な再レンダリングの防止
3. **遅延読み込み**: 大量デバイス接続時の対応

### アクセシビリティ

1. **キーボードナビゲーション**: デバイスカード間の移動
2. **スクリーンリーダー**: 適切なAria属性設定
3. **色以外の識別**: デバイスIDテキストによる識別

## 将来拡張計画

### 機能拡張

1. **デバイス詳細表示**: カードクリック時のモーダル表示
2. **装着位置編集**: ドラッグ&ドロップによる位置変更
3. **デバイス設定**: 個別デバイスの設定変更UI

### 技術拡張

1. **DeviceColorManager統合**: ハードウェアからの色取得
2. **リアルタイム状態**: LED状態のリアルタイム反映
3. **アニメーション**: 接続/切断時のスムーズなトランジション

## 依存関係

### 既存システム

- `useMesh`: デバイス接続情報
- `useTrackConfig`: トラック設定情報
- `playerSyncStates`: プレイヤー状態管理
- `InstrumentIcon`: 楽器アイコン表示

### 新規システム

- `OldestNodeFinder`: デバイス接続順序管理（仕様書に記載済み）
- `DeviceColorManager`: デバイス色管理（将来実装）

---

*このドキュメントは実装進捗に応じて更新されます。*
