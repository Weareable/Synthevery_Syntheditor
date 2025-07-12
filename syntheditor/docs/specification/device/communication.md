# Syntheveryデバイス 通信仕様

## 概要

Syntheveryデバイスは、Bluetooth Low Energy（BLE）を基盤とした通信システムを採用しています。Meshネットワーク機能により、複数デバイス間での協調的な音楽制作を実現します。

## Bluetooth Low Energy（BLE）仕様

### 基本仕様
- **プロトコル**: Bluetooth Low Energy 4.0以上
- **通信距離**: 最大10m（屋内環境）
- **通信速度**: 最大1Mbps
- **周波数帯**: 2.4GHz ISM帯
- **チャンネル数**: 40チャンネル（3広告チャンネル + 37データチャンネル）

### デバイス検出
```javascript
export const SyntheveryDeviceFilter = {
    filters: [
        { services: [MESH_SERVICE_UUID], namePrefix: "Synthevery" },
        { services: [BLE_MIDI_SERVICE_UUID], namePrefix: "Synthevery" }
    ],
    optionalServices: [
        MESH_SERVICE_UUID,
        CONNECTION_INFO_SERVICE_UUID,
        BLE_MIDI_SERVICE_UUID
    ]
};
```

### サービスUUID
- **MESH_SERVICE_UUID**: `"0f287fc3-97db-a249-e3ce-9461eb65dc52"`
- **CONNECTION_INFO_SERVICE_UUID**: `"3b145d6b-721d-f02b-4718-61a32f860fa5"`
- **BLE_MIDI_SERVICE_UUID**: `"03b80e5a-ede8-4b33-a751-6ce34ec4c700"`

## GATTサービス・キャラクタリスティック

### Mesh Service
**UUID**: `0f287fc3-97db-a249-e3ce-9461eb65dc52`

#### Mesh Packet TX Characteristic
- **UUID**: `"eeb4f625-d307-efb1-779e-6d913d961982"`
- **プロパティ**: Write Without Response
- **用途**: Meshパケットの送信

#### Mesh Packet RX Characteristic
- **UUID**: `"eba308dc-e069-d268-a43f-2e341418fae9"`
- **プロパティ**: Notify
- **用途**: Meshパケットの受信

### Connection Info Service
**UUID**: `3b145d6b-721d-f02b-4718-61a32f860fa5`

#### MAC Address Characteristic
- **UUID**: `"e8771894-9411-6d2e-ae0c-cb2eb5cb1c40"`
- **プロパティ**: Read
- **用途**: デバイスのMACアドレス取得

#### Connected Devices Characteristic
- **UUID**: `"befea93d-5f47-9a86-b6e1-720f19430641"`
- **プロパティ**: Read, Notify
- **用途**: 接続済みデバイスリストの取得・更新

### BLE MIDI Service
**UUID**: `03b80e5a-ede8-4b33-a751-6ce34ec4c700`

#### BLE MIDI Characteristic
- **UUID**: `"7772e5db-3868-4112-a1a9-f2669d106bf3"`
- **プロパティ**: Read, Write, Notify
- **用途**: MIDIデータの送受信

## Meshネットワーク仕様

### ネットワーク構成
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Device 1  │◄──►│   Device 2  │◄──►│   Device 3  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌─────────────┐
                    │   Device 4  │
                    └─────────────┘
```

### パケットタイプ
- **NEIGHBOR_LIST**: 0xFF - 近隣デバイスリスト
- **DEVICE_TYPE**: 0xFE - デバイスタイプ情報
- **RELATIVE_LEADER**: 0xFD - リーダー情報
- **APP_STATE**: 0xFC - アプリケーション状態
- **TIME_SYNC**: 0xFB - 時刻同期
- **TICK_CLOCK_SYNC**: 0xFA - クロック同期
- **COMMAND**: 0xF9 - コマンド
- **SENSOR_DATA**: 0xF8 - センサーデータ
- **MOTION_DATA**: 0xF7 - モーションデータ
- **PEER_DISTANCE**: 0xF6 - ピア距離
- **SRARQ_DATA**: 0xF5 - SRARQデータ
- **SRARQ_ACK**: 0xF4 - SRARQ応答

### パケット構造
```typescript
interface MeshPacket {
    source: P2PMacAddress;      // 送信元アドレス
    destination: P2PMacAddress; // 宛先アドレス
    type: number;               // パケットタイプ
    index: number;              // パケットインデックス
    data: Uint8Array;          // パケットデータ
}
```

### アドレス体系
- **APP_MAC_ADDRESS**: `[0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]`
- **デバイスアドレス**: 6バイトのMACアドレス

## 通信プロトコル

### 接続確立プロセス
1. **デバイス検出**: BLEスキャンでSyntheveryデバイスを検出
2. **GATT接続**: デバイスとのGATT接続を確立
3. **サービス発見**: 必要なサービスとキャラクタリスティックを発見
4. **初期化**: MACアドレス取得、通知開始
5. **Mesh参加**: Meshネットワークに参加

### データ転送プロセス
1. **パケット生成**: 送信データをMeshパケット形式に変換
2. **ルーティング**: 宛先デバイスへの経路決定
3. **送信**: BLE経由でパケットを送信
4. **中継**: 中間デバイスによるパケット中継
5. **受信**: 宛先デバイスでのパケット受信

### エラー処理
- **接続タイムアウト**: 30秒
- **再試行回数**: 最大3回
- **パケットロス検出**: シーケンス番号による検出
- **自動再接続**: 接続断時の自動再接続

## 同期機能

### 時刻同期
- **同期間隔**: 1秒
- **精度**: ±10ms
- **プロトコル**: Network Time Protocol（簡易版）

### クロック同期
- **BPM同期**: 全デバイス間でのBPM同期
- **拍子同期**: 拍子記号の同期
- **テンポ同期**: テンポ変更の同期

### 状態同期
- **演奏状態**: 再生/停止/一時停止
- **音量設定**: 各デバイスの音量
- **エフェクト設定**: リバーブ、ディレイ等

## セキュリティ

### 認証
- **ペアリング**: 初回接続時のペアリング
- **認証キー**: 256bit認証キー
- **再認証**: 定期的な再認証

### 暗号化
- **通信暗号化**: AES-128暗号化
- **データ整合性**: CRC-32チェックサム
- **改ざん検出**: HMAC-SHA256

### アクセス制御
- **デバイス認証**: 許可されたデバイスのみ接続
- **権限管理**: 読み取り/書き込み権限の管理
- **セッション管理**: セッションタイムアウト

## パフォーマンス

### 通信性能
- **レイテンシ**: 50ms以下
- **スループット**: 最大1Mbps
- **同時接続数**: 最大8台
- **パケットロス率**: 1%以下

### 電力効率
- **待機電力**: 1mW以下
- **通信電力**: 10mW以下
- **バッテリー寿命**: 4時間以上

## トラブルシューティング

### 接続問題
- **デバイスが見つからない**: BLEスキャンの確認
- **接続が切れる**: 距離・障害物の確認
- **通信が遅い**: 干渉・混雑の確認

### 同期問題
- **時刻がずれる**: 時刻同期の再実行
- **BPMがずれる**: クロック同期の再実行
- **状態がずれる**: 状態同期の再実行

## 将来拡張

### 通信機能拡張
- **Wi-Fi対応**: 長距離通信への対応
- **5G対応**: 高速通信への対応
- **クラウド連携**: オンライン機能

### プロトコル拡張
- **MIDI 2.0対応**: 次世代MIDIプロトコル
- **OSC対応**: Open Sound Control
- **WebRTC対応**: Webリアルタイム通信 