# Syntheveryアプリケーション アーキテクチャ仕様

## 概要

Syntheveryアプリケーションは、Next.js 14を基盤としたReactアプリケーションです。TypeScriptで開発され、Tailwind CSSでスタイリングされています。複数のSyntheveryデバイスとのBLE通信とMeshネットワーク機能を提供します。

## システムアーキテクチャ

### 全体構成
```
┌─────────────────────────────────────────────────────────────┐
│                    Syntheditor (Web App)                   │
├─────────────────────────────────────────────────────────────┤
│  React Components  │  Custom Hooks  │  Core Libraries     │
├─────────────────────────────────────────────────────────────┤
│              synthevery-core (Core Library)               │
├─────────────────────────────────────────────────────────────┤
│  BLE Connection  │  Mesh Network  │  Command System       │
├─────────────────────────────────────────────────────────────┤
│                    Synthevery Devices                      │
└─────────────────────────────────────────────────────────────┘
```

### レイヤー構成
1. **Presentation Layer**: Reactコンポーネント
2. **Business Logic Layer**: カスタムフック
3. **Core Library Layer**: synthevery-core
4. **Communication Layer**: BLE/Mesh通信
5. **Device Layer**: Syntheveryデバイス

## 技術スタック

### フロントエンド
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **UI Library**: React 18
- **Styling**: Tailwind CSS 4.x
- **Icons**: Lucide React
- **State Management**: React Hooks + Custom Hooks

### 通信・データ
- **BLE**: Web Bluetooth API
- **Serialization**: MessagePack
- **Event System**: EventEmitter3
- **Data Transfer**: Custom Protocol

### 開発・テスト
- **Testing**: Jest + Testing Library
- **Linting**: ESLint
- **Build Tool**: Next.js Build System
- **Package Manager**: npm

## ディレクトリ構造

```
syntheditor/
├── app/                          # Next.js App Router
│   ├── (connection)/             # 接続関連ページ
│   ├── (main)/                  # メインアプリケーション
│   │   ├── layout.tsx           # メインレイアウト
│   │   └── player/              # プレイヤー機能
│   └── test/                    # テストページ
├── components/                   # Reactコンポーネント
│   ├── ui/                      # UI基本コンポーネント
│   ├── icons/                   # アイコンコンポーネント
│   └── layouts/                 # レイアウトコンポーネント
├── hooks/                       # カスタムフック
├── lib/                         # ライブラリ
│   └── synthevery-core/         # コアライブラリ
│       ├── appstate/            # アプリケーション状態
│       ├── command/             # コマンドシステム
│       ├── connection/          # 通信機能
│       ├── data-transfer/       # データ転送
│       ├── devicetype/          # デバイスタイプ
│       └── player/              # プレイヤー機能
├── types/                       # TypeScript型定義
└── docs/                        # ドキュメント
```

## コアライブラリ (synthevery-core)

### 設計原則
- **React非依存**: コアライブラリはReactに依存しない
- **シングルトンパターン**: 主要クラスはシングルトン
- **イベント駆動**: EventEmitterによる疎結合設計
- **型安全性**: TypeScriptによる型安全性

### 主要モジュール

#### 1. Connection Module
```typescript
// BLE接続管理
class BLEDevice {
    connect(options: RequestDeviceOptions): Promise<void>
    disconnect(): Promise<void>
    readCharacteristic(serviceUuid: string, characteristicUuid: string): Promise<DataView>
    writeCharacteristic(serviceUuid: string, characteristicUuid: string, data: BufferSource): Promise<void>
}

// Meshネットワーク管理
class Mesh {
    connectDevice(): Promise<void>
    sendPacket(type: number, destination: P2PMacAddress, data: Uint8Array): Promise<void>
    getConnectedDevices(): P2PMacAddress[]
    getConnectedPeers(): P2PMacAddress[]
}
```

#### 2. Command Module
```typescript
// コマンドハンドラー
interface CommandHandler {
    setClientInterface(clientInterface: CommandClientInterface): void
    pushCommand(command: CommandID): boolean
    handlePacket(data: Uint8Array): void
}

// コマンドクライアント
interface CommandClientInterface {
    generateData(commandId: CommandID): Uint8Array
    handleData(commandId: CommandID, data: Uint8Array): [boolean, Uint8Array]
    getClientID(): number
}
```

#### 3. AppState Module
```typescript
// 同期状態管理
class SyncState<T> {
    getStore(): AppStateStore<T>
    notifyChange(): void
}

// 状態ストア
class AppStateStore<T> {
    value: T
    serialize(): Uint8Array
    deserialize(data: Uint8Array): boolean
}
```

#### 4. Player Module
```typescript
// プレイヤーコントローラー
class PlayerController {
    setPlayingState(state: "play" | "pause" | "stop"): void
    setBpm(bpm: number): void
}

// プレイヤー同期状態
class PlayerSyncStates {
    metronomeState: SyncState<boolean>
    tickClockState: ReadOnlySyncState<TickClockState>
    recorderState: SyncState<boolean>
    quantizerState: SyncState<boolean>
}
```

## Reactコンポーネントアーキテクチャ

### コンポーネント階層
```
App
├── MainLayout
│   ├── VerticalNavigationBar
│   ├── MainContent (Router)
│   │   ├── SynthesizerPage
│   │   ├── DrumsPage
│   │   ├── BassPage
│   │   └── SamplerPage
│   ├── DeviceStatusPanel
│   └── MediaControlBar
└── ReconnectModal
```

### 状態管理パターン

#### 1. AppState Pattern
```typescript
// 同期状態の使用
const [isQActive, setIsQActive] = useAppState(playerSyncStates.quantizerState);
const [isMActive, setIsMActive] = useAppState(playerSyncStates.metronomeState);
const [isRecording, setIsRecording] = useAppState(playerSyncStates.recorderState);
```

#### 2. Custom Hook Pattern
```typescript
// プレイヤー制御
const { playingState, bpmState, setPlayingState, setBpmState, stop } = usePlayerControl();

// Mesh接続
const { connectedDevices, connectedPeers, connectDevice } = useMesh();
```

#### 3. Local State Pattern
```typescript
// ローカル状態（UI応答性のため）
const [localBpm, setLocalBpm] = useState(bpmState);
const [isMuted, setIsMuted] = useState(false);
```

## 通信アーキテクチャ

### BLE通信フロー
```
1. デバイス検出 → 2. GATT接続 → 3. サービス発見 → 4. 初期化 → 5. Mesh参加
```

### Mesh通信フロー
```
1. パケット生成 → 2. ルーティング → 3. 送信 → 4. 中継 → 5. 受信
```

### 状態同期フロー
```
1. 状態変更 → 2. シリアライズ → 3. Mesh送信 → 4. 他デバイス受信 → 5. デシリアライズ → 6. 状態更新
```

## パフォーマンス最適化

### React最適化
- **メモ化**: useCallback, useMemoの活用
- **仮想化**: 大量データの仮想化
- **遅延読み込み**: 動的インポート
- **バンドル分割**: コード分割

### 通信最適化
- **デバウンス**: BPM変更のデバウンス
- **バッチ処理**: 複数コマンドの一括送信
- **キャッシュ**: 頻繁に使用されるデータのキャッシュ
- **圧縮**: データ転送時の圧縮

### メモリ最適化
- **ガベージコレクション**: 適切なメモリ解放
- **オブジェクトプール**: 頻繁に作成されるオブジェクトの再利用
- **弱参照**: 不要な参照の自動解放

## セキュリティ

### 通信セキュリティ
- **BLE暗号化**: AES-128暗号化
- **認証**: デバイス認証
- **権限管理**: 読み取り/書き込み権限

### アプリケーションセキュリティ
- **入力検証**: ユーザー入力の検証
- **XSS対策**: コンテンツセキュリティポリシー
- **CSRF対策**: トークンベース認証

## エラーハンドリング

### 通信エラー
- **接続エラー**: 自動再接続
- **タイムアウト**: 再試行メカニズム
- **パケットロス**: 再送信

### アプリケーションエラー
- **React Error Boundary**: コンポーネントエラーの捕捉
- **グローバルエラーハンドラー**: 未処理エラーの捕捉
- **ログ記録**: エラーログの記録

## テスト戦略

### 単体テスト
- **コンポーネントテスト**: React Testing Library
- **フックテスト**: カスタムフックのテスト
- **ユーティリティテスト**: 純粋関数のテスト

### 統合テスト
- **通信テスト**: BLE通信のテスト
- **状態同期テスト**: 複数デバイス間の同期テスト
- **E2Eテスト**: ユーザーフローのテスト

## 将来の改善計画

### アーキテクチャ改善
1. **外部ライブラリ分離**: synthevery-coreの独立
2. **マイクロフロントエンド**: 機能別の分割
3. **PWA対応**: オフライン機能の強化

### パフォーマンス改善
1. **WebAssembly**: 重い処理のWASM化
2. **Web Workers**: バックグラウンド処理
3. **Service Worker**: キャッシュ戦略

### 機能拡張
1. **リアルタイム協調**: WebRTC対応
2. **AI機能**: 機械学習による自動化
3. **クラウド連携**: オンライン機能 