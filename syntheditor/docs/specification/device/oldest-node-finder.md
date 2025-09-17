# OldestNodeFinder 仕様書

## 概要

OldestNodeFinderは、Meshネットワーク上のデバイスの接続順序を決定するための機能です。デバイスパネルでデバイスID（A, B, C, D...）を割り当てる際の基準となる接続順序を提供します。

## 目的

### 主要な用途
1. **デバイスID割り当て**: デバイスパネルでのアルファベット順ID（A, B, C, D...）の決定
2. **接続順序の追跡**: どのデバイスが最初に接続されたかの記録
3. **一貫性の保証**: アプリケーション再起動時も同じデバイスIDを維持

### 背景
- 現在の実装では、デバイスの接続順序を取得する機能が未実装
- デバイスパネルの実装に必要な基盤機能
- ユーザーエクスペリエンスの向上（デバイスIDの一貫性）

## 技術仕様

### 基本概念
- **Oldest Node**: 最も早く接続されたデバイス
- **接続順序**: デバイスがMeshネットワークに参加した順序
- **永続化**: 接続順序情報の保存と復元

### データ構造
```typescript
interface DeviceConnectionOrder {
    deviceId: string;           // デバイスのMACアドレス
    connectionTimestamp: number; // 接続時刻（Unix timestamp）
    orderIndex: number;         // 接続順序（0, 1, 2, ...）
}

interface OldestNodeFinderState {
    devices: Map<string, DeviceConnectionOrder>;
    lastUpdate: number;
}
```

## 実装仕様

### クラス構造
```typescript
class OldestNodeFinder {
    private connectionOrder: Map<string, DeviceConnectionOrder>;
    private eventEmitter: EventEmitter;
    
    // メソッド群
    addDevice(deviceId: string): void;
    removeDevice(deviceId: string): void;
    getDeviceOrder(deviceId: string): number;
    getOrderedDevices(): DeviceConnectionOrder[];
    getOldestDevice(): string | null;
    getDeviceIdByOrder(orderIndex: number): string | null;
}
```

### 主要メソッド

#### 1. addDevice(deviceId: string)
- **目的**: 新規デバイスの接続を記録
- **処理内容**:
  - 現在時刻を取得
  - 接続順序を決定（既存デバイス数 + 1）
  - DeviceConnectionOrderオブジェクトを作成
  - connectionOrderマップに保存
  - イベント発火

#### 2. removeDevice(deviceId: string)
- **目的**: デバイスの切断を記録
- **処理内容**:
  - 指定デバイスをconnectionOrderから削除
  - 残りのデバイスの接続順序を再計算
  - イベント発火

#### 3. getDeviceOrder(deviceId: string)
- **目的**: 指定デバイスの接続順序を取得
- **戻り値**: 接続順序（0, 1, 2, ...）または -1（未接続）

#### 4. getOrderedDevices()
- **目的**: 接続順序でソートされたデバイスリストを取得
- **戻り値**: DeviceConnectionOrder[]（接続順序順）

#### 5. getOldestDevice()
- **目的**: 最も早く接続されたデバイスIDを取得
- **戻り値**: デバイスIDまたはnull（デバイス未接続時）

## 統合方法

### 既存システムとの連携
1. **Mesh接続イベント**: `mesh.connected`イベントでaddDevice呼び出し
2. **Mesh切断イベント**: `mesh.disconnected`イベントでremoveDevice呼び出し
3. **状態同期**: AppStateSyncConnectorとの連携

### イベントシステム
```typescript
interface OldestNodeFinderEvents {
    deviceAdded: (deviceId: string, order: number) => void;
    deviceRemoved: (deviceId: string) => void;
    orderChanged: (devices: DeviceConnectionOrder[]) => void;
}
```

## 永続化と復元

### データ保存
- **保存先**: localStorage（ブラウザ）またはIndexedDB
- **保存タイミング**: デバイス接続/切断時、アプリケーション終了時
- **保存形式**: JSON形式でシリアライズ

### データ復元
- **復元タイミング**: アプリケーション起動時
- **復元処理**: 保存されたデータからconnectionOrderマップを再構築
- **整合性チェック**: 現在接続中のデバイスとの整合性確認

## エラー処理

### エラーケース
1. **重複接続**: 既に接続済みのデバイスが再度接続された場合
2. **順序不整合**: 接続順序が連続していない場合
3. **データ破損**: 永続化データが破損している場合

### エラー対応
- **重複接続**: 既存の接続情報を維持
- **順序不整合**: 接続順序を再計算
- **データ破損**: デフォルト値で初期化

## パフォーマンス考慮事項

### 最適化
- **Map使用**: O(1)の検索性能を実現
- **イベント発火**: 必要最小限のイベント発火
- **メモリ管理**: 切断デバイスの適切な削除

### 制限事項
- **最大デバイス数**: 26台（A-Zの制限）
- **更新頻度**: 接続/切断時のみ
- **メモリ使用量**: デバイス数に比例

## テスト仕様

### 単体テスト
1. **接続順序テスト**: 複数デバイスの接続順序確認
2. **切断テスト**: デバイス切断時の順序再計算
3. **永続化テスト**: データ保存・復元の動作確認

### 統合テスト
1. **Mesh連携テスト**: 実際のMesh接続との連携確認
2. **イベントテスト**: イベント発火のタイミング確認
3. **パフォーマンステスト**: 大量デバイス接続時の性能確認

## 実装優先順位

### Phase 1: 基本機能
1. OldestNodeFinderクラスの基本実装
2. 接続/切断イベントの処理
3. 基本的な順序管理機能

### Phase 2: 永続化
1. localStorage/IndexedDBでのデータ保存
2. アプリケーション起動時のデータ復元
3. データ整合性チェック

### Phase 3: 最適化
1. パフォーマンス最適化
2. エラー処理の強化
3. テストケースの充実

## 関連コンポーネント

### 直接関連
- **DevicePanel**: デバイスID表示での使用
- **Mesh接続管理**: 接続/切断イベントの監視
- **AppStateSyncConnector**: 状態同期との連携

### 間接関連
- **TrackSelectPanel**: デバイス順序の表示
- **DeviceStatusPanel**: デバイス状態の表示
- **VerticalNavigationBar**: ナビゲーションでの使用

## 将来拡張

### 機能拡張
- **接続履歴**: 過去の接続履歴の保持
- **統計情報**: 接続時間、接続頻度などの統計
- **優先度設定**: 特定デバイスの優先接続

### 技術的改善
- **分散管理**: 複数アプリケーション間での順序共有
- **リアルタイム同期**: 他ユーザーとの接続順序同期
- **機械学習**: 接続パターンの学習と予測
