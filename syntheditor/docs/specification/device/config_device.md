# 設定ファイル送信機能 仕様書

## 概要

webアプリからデバイスへ設定ファイルの要求を送信し、デバイスが指定された階層的なパスの設定を取得してwebアプリへ送信する機能です。

## 機能仕様

### 1. 基本機能
- **目的**: webアプリからデバイス内の設定ファイルを要求し、デバイスが該当する設定を取得・送信
- **データ形式**: MsgPackを使用した可変長配列のstring
- **アクセス方式**: 階層的なJSONパスアクセス（`json["A"]["B"]["C"]`）
- **通信方向**: webアプリ → デバイス（要求）、デバイス → webアプリ（設定送信）

### 2. コマンド仕様

#### コマンドID
- **値**: `0x15` (21)
- **名前**: `kRequestSettingsConfig`
- **タイプ**: 設定ファイル要求コマンド

#### データタイプ
- **値**: `0xA0` (160)
- **名前**: `kSettingsConfig`
- **用途**: 設定ファイル用データタイプ

### 3. データ構造

#### SettingsConfigRequest構造体
```cpp
struct SettingsConfigRequest {
  std::vector<std::string> namespaces;  // 要求するJSONネームスペースの配列
  
  void to_msgpack(MsgPack::Packer& packer) const;
  void from_msgpack(MsgPack::Unpacker& unpacker);
};
```

#### MsgPackシリアライゼーション
- **送信時**: `std::vector<std::string>` → `std::vector<MsgPack::str_t>`
- **受信時**: `std::vector<MsgPack::str_t>` → `std::vector<std::string>`

### 4. 動作仕様

#### 4.1 要求受信・処理
1. **webアプリからの要求受信**
   - デバイスが`kRequestSettingsConfig`コマンドを受信
   - MsgPackでデシリアライズしてネームスペース配列を取得

2. **ルートネームスペース読み込み**
   - 配列の最初の要素をルートネームスペースとして設定ファイルを読み込み
   - `settings_io_->loadSettings(root_namespace)`

3. **階層的アクセス**
   - 配列の各要素を順番に辿ってネストしたJSONオブジェクトにアクセス
   - 例：`["core", "player", "metronome"]` → `json["core"]["player"]["metronome"]`

4. **エラーハンドリング**
   - 存在しないネームスペース: 処理中断、警告ログ出力
   - nullオブジェクト: 処理中断、警告ログ出力
   - 空配列: 処理中断、警告ログ出力

#### 4.2 設定送信
- **送信元**: デバイス
- **送信先**: webアプリ（`WirelessConnectionModule::kEditorAppMacAddress`）
- **送信対象**: 最終的に到達したネストしたオブジェクト
- **ファイル名**: `"settings_" + 階層的パス`
- **データタイプ**: `kSettingsConfig` (0xA0)

### 5. 通信フロー

```
webアプリ                   デバイス
   |                          |
   |-- 1. 設定要求 ----------->|
   |   kRequestSettingsConfig  |
   |   ["core", "player"]      |
   |                          |
   |                          |-- 2. 設定ファイル読み込み
   |                          |   settings_io_->loadSettings("core")
   |                          |
   |                          |-- 3. 階層的アクセス
   |                          |   json["core"]["player"]
   |                          |
   |                          |-- 4. 設定送信準備
   |                          |   JsonStore::Sender作成
   |                          |
   |<-- 5. 設定データ --------|
   |   kSettingsConfig         |
   |   "settings_core.player"  |
```

### 6. 使用例

#### 6.1 単一ネームスペース
```json
["core"]
```
- アクセス: `json["core"]`
- ファイル名: `settings_core`

#### 6.2 2階層ネームスペース
```json
["core", "player"]
```
- アクセス: `json["core"]["player"]`
- ファイル名: `settings_core.player`

#### 6.3 3階層ネームスペース
```json
["core", "player", "metronome"]
```
- アクセス: `json["core"]["player"]["metronome"]`
- ファイル名: `settings_core.player.metronome`

### 7. ログ出力

#### 7.1 情報ログ
- 受信したネームスペース数
- 階層的パス
- 送信開始（セッションID含む）

#### 7.2 警告ログ
- 空配列受信
- ルートネームスペースの設定が見つからない
- パス内でネームスペースが見つからない
- nullオブジェクト発見

#### 7.3 エラーログ
- MsgPackデシリアライゼーション失敗
- 設定送信失敗

### 8. 技術仕様

#### 8.1 依存関係
- **MsgPack**: データシリアライゼーション/デシリアライゼーション
- **SettingsIO**: 設定ファイル読み込み
- **JsonStore**: 設定データ送信
- **DataTransferController**: データ転送制御

#### 8.2 非同期処理
- **タイマー**: 10ms遅延後に処理実行
- **理由**: メインスレッドのブロッキング回避

#### 8.3 メモリ管理
- **スマートポインタ**: `std::shared_ptr`を使用
- **自動クリーンアップ**: RAIIによるリソース管理

### 9. 制限事項

#### 9.1 パス長制限
- 理論上は無制限だが、実用的には10階層程度を推奨

#### 9.2 ファイルサイズ制限
- デバイスのメモリ容量に依存
- 設定ファイルの最大サイズは実装依存

#### 9.3 エラー時の動作
- エラーが発生した場合は処理を中断
- 部分的な設定送信は行わない

### 10. 将来拡張

#### 10.1 予定機能
- 設定ファイルの書き込み機能
- 設定ファイルの差分送信
- 設定ファイルのバージョン管理

#### 10.2 検討中
- 設定ファイルの暗号化
- 設定ファイルの圧縮
- 設定ファイルのキャッシュ機能

## 変更履歴

| 日付 | バージョン | 変更内容 | 変更者 |
|------|------------|----------|--------|
| 2024-12-19 | 1.0.0 | 初版作成 | AI Assistant |
| 2024-12-19 | 1.1.0 | 階層的パス処理に変更 | AI Assistant |

## 関連ドキュメント

- [デバイス起動順序表示機能_仕様書.md](./デバイス起動順序表示機能_仕様書.md)
- [コーディング作法レビュー指摘事項.md](../reviews/コーディング作法レビュー指摘事項.md)
- [デバイス起動順序表示機能_タスクリスト.md](../tasks/デバイス起動順序表示機能_タスクリスト.md)
