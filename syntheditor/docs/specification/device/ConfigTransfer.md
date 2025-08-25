# Config Transfer (Device -> Web App)

この文書では、デバイス側の設定を Web アプリへ送信する機能の構成と動作を説明します。新規クラス `PayloadCommandClient` と `SettingsConfigCommandClient` を統合し、既存のコマンドディスパッチフローを変えずに実現します。

## 目的
- Web アプリからパス指定で要求（例: `player.audio.volume`）
- デバイスは該当 JSON を抽出し、データ転送プロトコルで返送

## コンポーネント
- `PayloadCommandClient`（Connection）
  - 送信時のペイロードを事前登録し、再送に同一データを提供
  - セッション自動採番（0..255 単調前進）
- `SettingsConfigCommandClient`（EditorAppConnector）
  - `PayloadCommandClient` を継承
  - 受信データ（パス）を解析し、`SettingsIO` から JSON を抽出
  - `DataTransferController::sendRequest(kEditorAppMacAddress, sender)` で送信

## フロー
1. Editor App -> デバイスへ「設定要求」コマンド（`client_id = kEditorSettingsConfig`）を送信（ペイロード: パス文字列）
2. デバイスの `SettingsConfigCommandClient::onHandleData` が受信
3. 10ms 後、`SettingsIO` で該当 JSON を抽出
4. `JsonStore::Sender` を作成し、`DataTransferController` で Web アプリに送信
5. 送信セッションIDをログ出力

## 登録/初期化
```cpp
// EditorAppConnectorModule::init 内
settings_config_command_client_ = std::make_shared<SettingsConfigCommandClient>(
  CommandModule::ClientID::kEditorSettingsConfig,
  data_transfer_module->getDataTransferController(),
  core->getFastloopTimerList(), settings_io);

command_module->getCommandDispatcher()
  ->getCommandHandler(WirelessConnectionModule::kEditorAppMacAddress, true)
  ->setClientInterface(settings_config_command_client_);
```

## 例: Web アプリからの要求
- ペイロード: `"player.audio"`（NUL 終端可）
- デバイスの送信名: `settings_player.audio`（拡張子無し）
- DataType: `kSettingsConfig`

## エラー処理
- パス空/不正/未存在: WARN ログ、送信スキップ
- 設定読込失敗: ERROR/WARN ログ
- 送信開始失敗: ERROR ログ

## 備考
- クライアントIDは専用: `kEditorSettingsConfig`
- 既存の `DeviceControlCommandClient` と併存可能
- 送信フォーマットやパス仕様は今後拡張可
