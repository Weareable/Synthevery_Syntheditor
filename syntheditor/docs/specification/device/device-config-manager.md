# DeviceConfigManager

## 概要

DeviceConfigManagerは、メッシュネットワーク上のデバイスからNoteBuilderConfigを自動的に取得・管理するシングルトンクラスです。新規デバイス接続時に自動で設定をリクエストし、受信した設定をデバイスごとに保持します。

## 主要機能

### 1. 自動設定管理
- **新規デバイス接続検知**: `mesh.connected`イベントでデバイス接続を監視
- **自動リクエスト**: 接続時に自動でNoteBuilderConfigをリクエスト
- **設定保存**: 受信した設定をデバイスごとにMapで管理
- **自動クリーンアップ**: デバイス切断時に設定データを削除

### 2. 送信元特定
- **送信元追跡**: JsonReceiverDataStoreで送信元デバイスを特定
- **正確な保存**: 受信した設定を正しいデバイスに紐付けて保存
- **イベント通知**: 設定受信時に送信元情報を含めてイベント発火

### 3. エラー対策
- **初期化順序対応**: デバイス接続時に100ms遅延でhandler初期化完了を待機
- **自己参照防止**: webアプリ（自分自身）へのリクエスト送信を防止
- **堅牢な処理**: 接続・切断イベントベースの確実な処理

## アーキテクチャ

### クラス構造
```
DeviceConfigManager
├── deviceConfigs: Map<string, NoteBuilderConfig[]>
├── noteBuilderConfigReceiverPort: NoteBuilderConfigReceiverPort
├── eventEmitter: EventEmitter<DeviceConfigManagerEvents>
└── メソッド群
```

### イベントフロー
```
デバイス接続
    ↓
mesh.connected イベント
    ↓
100ms遅延（初期化完了待機）
    ↓
playerController.requestNoteBuilderConfig()
    ↓
相手デバイスからNoteBuilderConfig受信
    ↓
JsonReceiverDataStore.received イベント
    ↓
deviceConfigsに保存
    ↓
configReceived イベント発火
```

## API仕様

### イベント

#### DeviceConfigManagerEvents
```typescript
interface DeviceConfigManagerEvents {
    configReceived: (device: P2PMacAddress, config: NoteBuilderConfig[]) => void;
    deviceConnected: (device: P2PMacAddress) => void;
    deviceDisconnected: (device: P2PMacAddress) => void;
}
```

#### イベント説明
- **configReceived**: NoteBuilderConfigを受信した時に発火
- **deviceConnected**: デバイスが接続された時に発火
- **deviceDisconnected**: デバイスが切断された時に発火

### メソッド

#### getConfig(device: P2PMacAddress): NoteBuilderConfig[] | undefined
特定デバイスのNoteBuilderConfigを取得します。

```typescript
const config = deviceConfigManager.getConfig(deviceAddress);
if (config) {
    console.log('Config found:', config);
}
```

#### getAllConfigs(): Map<string, NoteBuilderConfig[]>
全デバイスのNoteBuilderConfigを取得します。

```typescript
const allConfigs = deviceConfigManager.getAllConfigs();
allConfigs.forEach((config, deviceStr) => {
    console.log(`Device ${deviceStr}:`, config);
});
```

## 使用方法

### 基本的な使用例

```typescript
import { deviceConfigManager } from "@/lib/synthevery-core/player/device-config-manager";
import { getAddressString } from "@/lib/synthevery-core/connection/util";

// イベントリスナーの設定
deviceConfigManager.eventEmitter.on('configReceived', (device, config) => {
    console.log('Config received from:', getAddressString(device), 'config:', config);
});

deviceConfigManager.eventEmitter.on('deviceConnected', (device) => {
    console.log('Device connected:', getAddressString(device));
});

deviceConfigManager.eventEmitter.on('deviceDisconnected', (device) => {
    console.log('Device disconnected:', getAddressString(device));
});

// 特定デバイスの設定取得
const deviceAddress = { address: new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]) };
const config = deviceConfigManager.getConfig(deviceAddress);

// 全デバイスの設定取得
const allConfigs = deviceConfigManager.getAllConfigs();
```

### Reactコンポーネントでの使用例

```typescript
import React, { useEffect, useState } from 'react';
import { deviceConfigManager } from "@/lib/synthevery-core/player/device-config-manager";
import { getAddressString } from "@/lib/synthevery-core/connection/util";

const DeviceConfigPanel: React.FC = () => {
    const [deviceConfigs, setDeviceConfigs] = useState<Map<string, any[]>>(new Map());

    useEffect(() => {
        // 設定受信時の処理
        const handleConfigReceived = (device: P2PMacAddress, config: NoteBuilderConfig[]) => {
            setDeviceConfigs(new Map(deviceConfigManager.getAllConfigs()));
        };

        deviceConfigManager.eventEmitter.on('configReceived', handleConfigReceived);

        return () => {
            deviceConfigManager.eventEmitter.off('configReceived', handleConfigReceived);
        };
    }, []);

    return (
        <div>
            <h3>Device Configurations</h3>
            {Array.from(deviceConfigs.entries()).map(([deviceStr, config]) => (
                <div key={deviceStr}>
                    <strong>Device: {deviceStr}</strong>
                    <pre>{JSON.stringify(config, null, 2)}</pre>
                </div>
            ))}
        </div>
    );
};
```

## 実装詳細

### 初期化処理
1. **ReceiverPort登録**: NoteBuilderConfigReceiverPortをdataTransferControllerに登録
2. **イベントリスナー設定**: meshとdataTransferControllerのイベントを監視
3. **既存デバイス処理**: 初期化時に既存の接続デバイスに対して設定をリクエスト

### デバイス接続処理
1. **接続検知**: `mesh.connected`イベントでデバイス接続を検知
2. **遅延処理**: 100ms遅延でhandler初期化完了を待機
3. **自己参照チェック**: 自分自身のデバイスにはリクエストを送信しない
4. **リクエスト送信**: playerController.requestNoteBuilderConfig()で設定をリクエスト

### 設定受信処理
1. **受信検知**: JsonReceiverDataStore.receivedイベントで設定受信を検知
2. **送信元特定**: 送信元デバイス情報を含めて受信
3. **保存処理**: deviceConfigsに送信元デバイスをキーとして保存
4. **イベント発火**: configReceivedイベントで外部に通知

### デバイス切断処理
1. **切断検知**: `mesh.disconnected`イベントでデバイス切断を検知
2. **データ削除**: deviceConfigsから該当デバイスの設定を削除
3. **イベント発火**: deviceDisconnectedイベントで外部に通知

## 注意事項

### 初期化順序
- デバイス接続直後にリクエストを送信するとhandler unavailableエラーが発生する可能性があります
- 100msの遅延処理により初期化完了を待機しています

### 自己参照防止
- webアプリ（自分自身）のデバイスアドレスにはリクエストを送信しません
- `mesh.getAddress()`で自分のアドレスを取得して比較しています

### メモリ管理
- デバイス切断時に自動で設定データを削除します
- 長時間の運用時は定期的なメモリ使用量の監視を推奨します

## 関連ファイル

- **実装**: `syntheditor/lib/synthevery-core/player/device-config-manager.ts`
- **設定タイプ**: `syntheditor/lib/synthevery-core/types/player.ts`
- **テストページ**: `syntheditor/app/test/core/data-transfer/page.tsx`
- **関連コンポーネント**: `syntheditor/lib/synthevery-core/player/config.ts` 