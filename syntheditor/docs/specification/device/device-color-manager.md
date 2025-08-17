# デバイス色管理機能仕様書

## 概要

デバイス色管理機能は、Syntheveryデバイスの本体色とLED色を取得・管理し、UIコンポーネントでの視覚的表現に活用するための機能です。デバイスパネルでのデバイスアイコン表示や、その他のUI要素での色分けに使用されます。

## 目的

### 主要な用途
1. **デバイス識別**: 各デバイスを色で区別し、視覚的な識別を容易にする
2. **状態表示**: LED色によるデバイスの状態（接続、演奏中、エラー等）の表示
3. **UI一貫性**: デバイス固有の色をUI全体で一貫して使用
4. **ユーザビリティ向上**: 色による直感的なデバイス操作

### 背景
- 現在の実装では、デバイスの色情報を取得する機能が未実装
- デバイスパネルの実装に必要な基盤機能
- ハードウェア仕様で定義されているデバイス色とLED機能の活用

## ハードウェア仕様との対応

### デバイス本体色
- **仕様**: ハードウェア仕様で定義されたデバイスの基本色
- **種類**: ダークグレー（メイン）、アクセントカラー
- **取得方法**: デバイス設定から取得（実装予定）

### LED色
- **仕様**: RGB LEDによる状態表示
- **配置**: 演奏ボタン内蔵、ステータス表示用
- **制御**: デバイス側での状態に応じた色変更

## 技術仕様

### データ構造
```typescript
interface DeviceColorInfo {
    deviceId: string;           // デバイスのMACアドレス
    bodyColor: DeviceBodyColor; // デバイス本体色
    ledColor: LEDColor;         // LED色
    lastUpdate: number;         // 最終更新時刻
}

interface DeviceBodyColor {
    primary: string;            // メインカラー（HEX）
    secondary: string;          // セカンダリカラー（HEX）
    accent: string;             // アクセントカラー（HEX）
}

interface LEDColor {
    red: number;                // 赤色値（0-255）
    green: number;              // 緑色値（0-255）
    blue: number;               // 青色値（0-255）
    brightness: number;         // 明度（0-100%）
    pattern: LEDPattern;        // LEDパターン
}

enum LEDPattern {
    SOLID = 'solid',            // 点灯
    BLINK = 'blink',            // 点滅
    PULSE = 'pulse',            // パルス
    RAINBOW = 'rainbow',        // レインボー
    OFF = 'off'                 // 消灯
}
```

### 色の表現方法
- **HEX形式**: #RRGGBB形式での色表現
- **RGB形式**: 0-255の値での色表現
- **HSL形式**: 色相・彩度・明度での色表現（必要に応じて）

## 実装仕様

### クラス構造
```typescript
class DeviceColorManager {
    private deviceColors: Map<string, DeviceColorInfo>;
    private eventEmitter: EventEmitter;
    private colorCache: Map<string, string>; // 計算済み色のキャッシュ
    
    // メソッド群
    getDeviceColors(deviceId: string): DeviceColorInfo | null;
    updateDeviceColors(deviceId: string, colors: Partial<DeviceColorInfo>): void;
    removeDevice(deviceId: string): void;
    getComputedColor(deviceId: string, type: 'body' | 'led'): string;
    subscribeToColorChanges(deviceId: string, callback: ColorChangeCallback): void;
}
```

### 主要メソッド

#### 1. getDeviceColors(deviceId: string)
- **目的**: 指定デバイスの色情報を取得
- **戻り値**: DeviceColorInfoオブジェクトまたはnull
- **処理内容**: キャッシュから色情報を取得、存在しない場合はデフォルト値を返す

#### 2. updateDeviceColors(deviceId: string, colors: Partial<DeviceColorInfo>)
- **目的**: デバイスの色情報を更新
- **処理内容**:
  - 既存の色情報とマージ
  - 色の妥当性チェック
  - キャッシュの更新
  - イベント発火

#### 3. removeDevice(deviceId: string)
- **目的**: デバイスの色情報を削除
- **処理内容**: 色情報とキャッシュの削除、イベント発火

#### 4. getComputedColor(deviceId: string, type: 'body' | 'led')
- **目的**: 計算済みの色値を取得（UI表示用）
- **戻り値**: CSSで使用可能な色値（HEX、RGB、HSL等）
- **処理内容**: 色の計算とキャッシュ管理

## 色取得の実装方法

### 1. デバイス設定からの取得
```typescript
// デバイス設定から色情報を取得する方法
interface DeviceConfig {
    // 既存の設定項目
    noteBuilderConfig: NoteBuilderConfig[];
    generatorConfig: GeneratorConfig[];
    
    // 新規追加項目
    deviceColors: DeviceColorInfo;
}
```

### 2. コマンド経由での取得
```typescript
// デバイスに色情報を要求するコマンド
class DeviceCommandClient {
    static readonly COMMAND_TYPE_REQUEST_DEVICE_COLORS = 0x20;
    
    requestDeviceColors(device: P2PMacAddress): void {
        // デバイス色情報の要求
    }
}
```

### 3. デフォルト色の設定
```typescript
// デバイス色が取得できない場合のデフォルト値
const DEFAULT_DEVICE_COLORS: DeviceColorInfo = {
    bodyColor: {
        primary: '#4B5563',    // ダークグレー
        secondary: '#6B7280',  // ミディアムグレー
        accent: '#3B82F6'      // ブルー
    },
    ledColor: {
        red: 0,
        green: 0,
        blue: 0,
        brightness: 50,
        pattern: LEDPattern.OFF
    }
};
```

## 統合方法

### 既存システムとの連携
1. **DeviceConfigManager**: デバイス設定取得時の色情報も同時取得
2. **Mesh接続管理**: デバイス接続時の色情報初期化
3. **AppStateSyncConnector**: 色情報の状態同期

### イベントシステム
```typescript
interface DeviceColorManagerEvents {
    colorsUpdated: (deviceId: string, colors: DeviceColorInfo) => void;
    deviceRemoved: (deviceId: string) => void;
    colorChange: (deviceId: string, oldColors: DeviceColorInfo, newColors: DeviceColorInfo) => void;
}
```

## パフォーマンス最適化

### キャッシュ戦略
- **色計算キャッシュ**: 計算済みの色値をキャッシュ
- **更新頻度制限**: LED色の更新頻度を制限（100ms間隔等）
- **メモリ管理**: 切断デバイスの色情報を適切に削除

### レンダリング最適化
- **差分更新**: 色が変更された場合のみUI更新
- **バッチ処理**: 複数デバイスの色変更を一括処理
- **遅延更新**: 非表示のデバイスは更新を遅延

## エラー処理

### エラーケース
1. **色情報取得失敗**: デバイスから色情報が取得できない場合
2. **不正な色値**: 範囲外の色値が設定された場合
3. **通信エラー**: デバイスとの通信が失敗した場合

### エラー対応
- **フォールバック**: デフォルト色を使用
- **リトライ**: 色情報取得の再試行
- **ログ出力**: エラーの詳細をログに記録

## テスト仕様

### 単体テスト
1. **色情報管理**: 色情報の追加・更新・削除の動作確認
2. **色計算**: 計算済み色値の正確性確認
3. **キャッシュ**: キャッシュの動作確認

### 統合テスト
1. **デバイス連携**: 実際のデバイスとの色情報取得確認
2. **UI連携**: 色情報のUI反映確認
3. **パフォーマンス**: 大量デバイス接続時の性能確認

## 実装優先順位

### Phase 1: 基本機能
1. DeviceColorManagerクラスの基本実装
2. デフォルト色の設定
3. 基本的な色情報管理機能

### Phase 2: デバイス連携
1. デバイスからの色情報取得機能
2. コマンド経由での色情報要求
3. 色情報の状態同期

### Phase 3: 最適化
1. キャッシュ機能の実装
2. パフォーマンス最適化
3. エラー処理の強化

## 関連コンポーネント

### 直接関連
- **DeviceIcon**: デバイスアイコンでの色表示
- **DevicePanel**: デバイスパネルでの色分け表示
- **DeviceStatusPanel**: デバイス状態での色表示

### 間接関連
- **TrackSelectPanel**: デバイス別の色分け表示
- **UIテーマ**: デバイス色に基づくテーマ調整
- **アニメーション**: 色変化のアニメーション効果

## 将来拡張

### 機能拡張
- **カスタム色設定**: ユーザーによる色のカスタマイズ
- **色テーマ**: デバイス色に基づくアプリケーションテーマ
- **色アニメーション**: 色変化のアニメーション効果

### 技術的改善
- **機械学習**: デバイス使用パターンに基づく色調整
- **環境適応**: 環境光に応じた色の自動調整
- **アクセシビリティ**: 色覚異常者への配慮
