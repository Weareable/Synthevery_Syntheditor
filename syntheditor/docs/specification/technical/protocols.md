# Syntheveryアプリケーション 通信プロトコル詳細仕様

## 概要

Syntheveryアプリケーションは、複数の通信プロトコルを組み合わせて、リアルタイムでの音楽制作を実現します。BLE、Mesh、コマンド、AppState、データ転送の各プロトコルが連携して動作します。

## プロトコル階層

### プロトコルスタック
```
┌─────────────────────────────────────────────────────────────┐
│                    Synthevery Application                  │
├─────────────────────────────────────────────────────────────┤
│  AppState Protocol  │  Command Protocol  │  Data Transfer  │
├─────────────────────────────────────────────────────────────┤
│                    Mesh Network Protocol                   │
├─────────────────────────────────────────────────────────────┤
│                ARQ (Automatic Repeat Request)              │
├─────────────────────────────────────────────────────────────┤
│              Bluetooth Low Energy (BLE)                    │
├─────────────────────────────────────────────────────────────┤
│                    Physical Layer                          │
└─────────────────────────────────────────────────────────────┘
```

### プロトコル間の関係
- **BLE**: 物理層通信プロトコル
- **ARQ**: 信頼性保証プロトコル
- **Mesh**: ネットワーク層プロトコル
- **Command**: アプリケーション層コマンドプロトコル
- **AppState**: アプリケーション層状態同期プロトコル
- **Data Transfer**: アプリケーション層データ転送プロトコル

## BLEプロトコル詳細

### GATTサービス構造

#### Mesh Service
```typescript
interface MeshService {
    uuid: "0f287fc3-97db-a249-e3ce-9461eb65dc52";
    characteristics: {
        tx: {
            uuid: "eeb4f625-d307-efb1-779e-6d913d961982";
            properties: ["write-without-response"];
            description: "Mesh packet transmission";
        };
        rx: {
            uuid: "eba308dc-e069-d268-a43f-2e341418fae9";
            properties: ["notify"];
            description: "Mesh packet reception";
        };
    };
}
```

#### Connection Info Service
```typescript
interface ConnectionInfoService {
    uuid: "3b145d6b-721d-f02b-4718-61a32f860fa5";
    characteristics: {
        macAddress: {
            uuid: "e8771894-9411-6d2e-ae0c-cb2eb5cb1c40";
            properties: ["read"];
            description: "Device MAC address";
        };
        connectedDevices: {
            uuid: "befea93d-5f47-9a86-b6e1-720f19430641";
            properties: ["read", "notify"];
            description: "Connected devices list";
        };
    };
}
```

### BLE通信フロー

#### 接続確立フロー
```typescript
interface ConnectionFlow {
    // 1. デバイス検出
    scan: {
        filters: [
            { services: [MESH_SERVICE_UUID] },
            { services: [BLE_MIDI_SERVICE_UUID] }
        ];
        optionalServices: [
            MESH_SERVICE_UUID,
            CONNECTION_INFO_SERVICE_UUID,
            BLE_MIDI_SERVICE_UUID
        ];
    };
    
    // 2. GATT接続
    connect: {
        device: BluetoothDevice;
        server: BluetoothRemoteGATTServer;
    };
    
    // 3. サービス発見
    discoverServices: {
        meshService: BluetoothRemoteGATTService;
        connectionInfoService: BluetoothRemoteGATTService;
        bleMidiService: BluetoothRemoteGATTService;
    };
    
    // 4. キャラクタリスティック取得
    getCharacteristics: {
        meshTx: BluetoothRemoteGATTCharacteristic;
        meshRx: BluetoothRemoteGATTCharacteristic;
        macAddress: BluetoothRemoteGATTCharacteristic;
        connectedDevices: BluetoothRemoteGATTCharacteristic;
    };
    
    // 5. 通知開始
    startNotifications: {
        meshRx: () => void;
        connectedDevices: () => void;
    };
}
```

## ARQプロトコル詳細

### パケット構造

#### ARQヘッダー
```typescript
interface ARQHeader {
    header: number;  // 1バイト
    // bit 7: ACKフラグ (1=ACK, 0=DATA)
    // bit 6-0: パケットインデックス (0-127)
}
```

#### ARQパケット
```typescript
interface ARQPacket {
    header: ARQHeader;
    data: Uint8Array;  // 可変長データ
}
```

### ARQ通信フロー

#### データ送信フロー
```typescript
interface ARQDataFlow {
    // 1. パケット生成
    generatePacket: (data: Uint8Array, index: number) => ARQPacket;
    
    // 2. 送信
    sendPacket: (packet: ARQPacket) => void;
    
    // 3. ACK待機
    waitForAck: (index: number, timeout: number) => Promise<boolean>;
    
    // 4. 再送信（タイムアウト時）
    retransmit: (packet: ARQPacket) => void;
}
```

#### ACK処理フロー
```typescript
interface ARQAckFlow {
    // 1. ACK受信
    receiveAck: (index: number, ackData: Uint8Array) => void;
    
    // 2. 重複検出
    checkDuplicate: (index: number) => boolean;
    
    // 3. 応答データ生成
    generateResponse: (index: number, data: Uint8Array) => Uint8Array;
    
    // 4. ACK送信
    sendAck: (index: number, responseData: Uint8Array) => void;
}
```

### ARQ設定
```typescript
interface ARQConfig {
    timeout: number;        // 1000ms
    retryCount: number;     // 3回
    maxIndex: number;       // 127
    windowSize: number;     // 1（シーケンシャル）
}
```

## Meshプロトコル詳細

### パケット構造

#### Meshパケットヘッダー
```typescript
interface MeshPacketHeader {
    source: P2PMacAddress;      // 6バイト
    destination: P2PMacAddress; // 6バイト
    type: number;               // 1バイト
    index: number;              // 1バイト
}
```

#### Meshパケット
```typescript
interface MeshPacket {
    header: MeshPacketHeader;
    data: Uint8Array;          // 可変長データ
}
```

### パケットタイプ定義

#### 基本パケットタイプ
```typescript
enum MeshPacketType {
    NEIGHBOR_LIST = 0xFF,      // 近隣デバイスリスト
    DEVICE_TYPE = 0xFE,        // デバイスタイプ情報
    RELATIVE_LEADER = 0xFD,    // リーダー情報
    APP_STATE = 0xFC,          // アプリケーション状態
    TIME_SYNC = 0xFB,          // 時刻同期
    TICK_CLOCK_SYNC = 0xFA,    // クロック同期
    COMMAND = 0xF9,            // コマンド
    SENSOR_DATA = 0xF8,        // センサーデータ
    MOTION_DATA = 0xF7,        // モーションデータ
    PEER_DISTANCE = 0xF6,      // ピア距離
    SRARQ_DATA = 0xF5,         // SRARQデータ
    SRARQ_ACK = 0xF4,          // SRARQ応答
}
```

### Mesh通信フロー

#### パケット送信フロー
```typescript
interface MeshSendFlow {
    // 1. パケット生成
    createPacket: (type: number, destination: P2PMacAddress, data: Uint8Array) => MeshPacket;
    
    // 2. ルーティング決定
    determineRoute: (destination: P2PMacAddress) => P2PMacAddress[];
    
    // 3. パケット送信
    sendPacket: (packet: MeshPacket) => Promise<void>;
    
    // 4. 中継処理
    relayPacket: (packet: MeshPacket) => void;
}
```

#### パケット受信フロー
```typescript
interface MeshReceiveFlow {
    // 1. パケット受信
    receivePacket: (data: Uint8Array) => MeshPacket;
    
    // 2. パケット検証
    validatePacket: (packet: MeshPacket) => boolean;
    
    // 3. 宛先チェック
    checkDestination: (packet: MeshPacket) => boolean;
    
    // 4. パケット処理
    processPacket: (packet: MeshPacket) => void;
}
```

## コマンドプロトコル詳細

### コマンド構造

#### コマンドID
```typescript
interface CommandID {
    client_id: number;  // 1バイト - クライアントID
    type: number;       // 1バイト - コマンドタイプ
}
```

#### コマンドパケット
```typescript
interface CommandPacket {
    commandId: CommandID;       // 2バイト
    data: Uint8Array;          // 可変長データ
}
```

#### コマンド結果
```typescript
interface CommandResult {
    command: CommandID;         // 2バイト
    result: number;             // 1バイト
    data: Uint8Array;          // 可変長データ
}
```

### コマンドクライアント定義

#### プレイヤーコントロールクライアント
```typescript
interface PlayerCommandClient {
    clientId: 0x01;
    commands: {
        PLAYING_STATE: 0x00;    // 再生状態設定
        BPM: 0x01;              // BPM設定
        STOP: 0x02;             // 停止
    };
}
```

#### データ転送クライアント
```typescript
interface DataTransferCommandClient {
    clientId: 0x02;
    commands: {
        REQUEST: 0x00;          // データ要求
        RESPONSE: 0x01;         // データ応答
        RESULT: 0x02;           // 結果通知
        CANCEL: 0x03;           // キャンセル
    };
}
```

### コマンド通信フロー

#### コマンド送信フロー
```typescript
interface CommandSendFlow {
    // 1. コマンド生成
    generateCommand: (clientId: number, type: number, data: Uint8Array) => CommandPacket;
    
    // 2. コマンドキュー追加
    enqueueCommand: (command: CommandID) => boolean;
    
    // 3. コマンド送信
    sendCommand: (command: CommandID) => void;
    
    // 4. ACK待機
    waitForAck: (command: CommandID) => Promise<boolean>;
}
```

#### コマンド受信フロー
```typescript
interface CommandReceiveFlow {
    // 1. コマンド受信
    receiveCommand: (data: Uint8Array) => CommandPacket;
    
    // 2. クライアント検索
    findClient: (clientId: number) => CommandClientInterface;
    
    // 3. コマンド処理
    processCommand: (command: CommandID, data: Uint8Array) => [boolean, Uint8Array];
    
    // 4. 応答送信
    sendResponse: (result: CommandResult) => void;
}
```

## AppStateプロトコル詳細

### 状態構造

#### 同期状態
```typescript
interface SyncState<T> {
    id: AppStateID;             // 状態ID
    store: AppStateStore<T>;    // 状態ストア
    eventEmitter: EventEmitter; // イベントエミッター
}
```

#### 状態ストア
```typescript
interface AppStateStore<T> {
    value: T;                   // 状態値
    serialize: () => Uint8Array; // シリアライズ関数
    deserialize: (data: Uint8Array) => boolean; // デシリアライズ関数
}
```

### AppState通信フロー

#### 状態変更フロー
```typescript
interface AppStateChangeFlow {
    // 1. 状態変更
    changeState: <T>(state: SyncState<T>, newValue: T) => void;
    
    // 2. シリアライズ
    serialize: (state: SyncState<T>) => Uint8Array;
    
    // 3. Mesh送信
    sendToMesh: (data: Uint8Array) => void;
    
    // 4. 他デバイス受信
    receiveFromMesh: (data: Uint8Array) => void;
    
    // 5. デシリアライズ
    deserialize: (data: Uint8Array) => T;
    
    // 6. 状態更新
    updateState: <T>(state: SyncState<T>, value: T) => void;
}
```

### AppState定義

#### プレイヤー状態
```typescript
interface PlayerStates {
    metronomeState: SyncState<boolean>;           // メトロノーム状態
    tickClockState: ReadOnlySyncState<TickClockState>; // クロック状態
    recorderState: SyncState<boolean>;            // 録音状態
    quantizerState: SyncState<boolean>;           // クオンタイザー状態
    currentTracksState: SyncState<Map<string, number>>; // 現在のトラック
    trackStates: SyncState<Array<TrackState>>;    // トラック状態
    devicePositions: SyncState<Map<string, number>>; // デバイス位置
}
```

#### クロック状態
```typescript
interface TickClockState {
    playing: boolean;    // 再生中
    bpm: number;         // BPM
}
```

#### トラック状態
```typescript
interface TrackState {
    loopLengthTick: number;  // ループ長（ティック）
    mute: boolean;           // ミュート
    volume: number;          // 音量
}
```

## データ転送プロトコル詳細

### セッション管理

#### セッション構造
```typescript
interface Session {
    id: number;              // セッションID
    peerAddress: P2PMacAddress; // ピアアドレス
    state: SessionState;     // セッション状態
    data: Uint8Array;        // 転送データ
    progress: number;        // 進捗（0-100）
}
```

#### セッション状態
```typescript
enum SessionState {
    IDLE = 0,           // 待機中
    REQUESTING = 1,     // 要求中
    TRANSFERRING = 2,   // 転送中
    COMPLETED = 3,      // 完了
    ERROR = 4,          // エラー
    CANCELLED = 5,      // キャンセル
}
```

### データ転送フロー

#### ファイル転送フロー
```typescript
interface FileTransferFlow {
    // 1. 転送要求
    requestTransfer: (filename: string, size: number) => Session;
    
    // 2. 転送承認
    acceptTransfer: (sessionId: number) => void;
    
    // 3. データ転送
    transferData: (sessionId: number, data: Uint8Array) => void;
    
    // 4. 転送完了
    completeTransfer: (sessionId: number) => void;
    
    // 5. エラー処理
    handleError: (sessionId: number, error: Error) => void;
}
```

### データ転送コマンド

#### 要求コマンド
```typescript
interface RequestCommand {
    sessionId: number;   // セッションID
    filename: string;    // ファイル名
    size: number;        // ファイルサイズ
    checksum: number;    // チェックサム
}
```

#### 応答コマンド
```typescript
interface ResponseCommand {
    sessionId: number;   // セッションID
    accepted: boolean;   // 承認フラグ
    errorCode: number;   // エラーコード
}
```

#### 結果コマンド
```typescript
interface ResultCommand {
    sessionId: number;   // セッションID
    success: boolean;    // 成功フラグ
    errorCode: number;   // エラーコード
}
```

## エラー処理・リカバリ

### エラーコード定義

#### コマンドエラー
```typescript
enum CommandError {
    SUCCESS = 0,                    // 成功
    INVALID_CLIENT_ID = 1,          // 無効なクライアントID
    INVALID_COMMAND_TYPE = 2,       // 無効なコマンドタイプ
    INVALID_DATA = 3,               // 無効なデータ
    TIMEOUT = 4,                    // タイムアウト
    NETWORK_ERROR = 5,              // ネットワークエラー
}
```

#### データ転送エラー
```typescript
enum DataTransferError {
    SUCCESS = 0,                    // 成功
    INVALID_SESSION = 1,            // 無効なセッション
    FILE_NOT_FOUND = 2,             // ファイルが見つからない
    INSUFFICIENT_SPACE = 3,         // 容量不足
    CRC_ERROR = 4,                  // CRCエラー
    TRANSFER_TIMEOUT = 5,           // 転送タイムアウト
}
```

### リカバリメカニズム

#### 自動再接続
```typescript
interface ReconnectionMechanism {
    // 接続断検出
    detectDisconnection: () => boolean;
    
    // 再接続試行
    attemptReconnection: () => Promise<boolean>;
    
    // 指数バックオフ
    calculateBackoff: (attempt: number) => number;
    
    // 最大試行回数
    maxAttempts: number;  // 5回
}
```

#### パケット再送信
```typescript
interface RetransmissionMechanism {
    // タイムアウト検出
    detectTimeout: (packetId: number) => boolean;
    
    // 再送信
    retransmit: (packetId: number) => void;
    
    // 重複検出
    detectDuplicate: (packetId: number) => boolean;
    
    // 最大再送信回数
    maxRetries: number;  // 3回
}
```

## パフォーマンス最適化

### 通信最適化

#### パケットサイズ最適化
```typescript
interface PacketOptimization {
    // 最大パケットサイズ
    maxPacketSize: number;  // 512バイト
    
    // フラグメンテーション
    fragment: (data: Uint8Array) => Uint8Array[];
    
    // 再構築
    reassemble: (fragments: Uint8Array[]) => Uint8Array;
}
```

#### 帯域幅最適化
```typescript
interface BandwidthOptimization {
    // 圧縮
    compress: (data: Uint8Array) => Uint8Array;
    
    // 展開
    decompress: (data: Uint8Array) => Uint8Array;
    
    // 優先度制御
    setPriority: (packetType: number, priority: number) => void;
}
```

### レイテンシ最適化

#### レイテンシ測定
```typescript
interface LatencyMeasurement {
    // 往復時間測定
    measureRTT: (packetId: number) => number;
    
    // 平均レイテンシ計算
    calculateAverageLatency: () => number;
    
    // レイテンシ予測
    predictLatency: () => number;
}
```

#### レイテンシ最適化
```typescript
interface LatencyOptimization {
    // パケット優先度
    setPacketPriority: (packet: MeshPacket, priority: number) => void;
    
    // ルーティング最適化
    optimizeRoute: (destination: P2PMacAddress) => P2PMacAddress[];
    
    // バッファサイズ調整
    adjustBufferSize: (latency: number) => void;
} 