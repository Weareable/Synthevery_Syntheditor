# SettingsConfigCommandClient

`SettingsConfigCommandClient` は `PayloadCommandClient` を継承したヘッダオンリークラスで、Web アプリからの設定要求（パス文字列）を受け取り、デバイス側の設定 JSON を抽出して `DataTransferController` 経由で Web アプリへ送信します。

- 受信パス形式: `root.child.grandchild` のような '.' 区切り
- 送信データ種別: `data_transfer::DataTypes::kSettingsConfig`
- 送信先: `WirelessConnectionModule::kEditorAppMacAddress`

## 主な責務
- `onHandleData` で要求パスを解析し、非同期に設定を抽出・送信
- 抽出失敗（パス不正/空/未存在）時はログ出力

## API（コンストラクタ）
- `SettingsConfigCommandClient(uint8_t client_id, DataTransferController* dtc, TimerList* async_timer_list, SettingsIO* settings_io, uint32_t wait_timeout_ms = 0)`

## 動作シーケンス
1. `onHandleData(id, data, len)` を受信
2. `data` をパス文字列として解析（末尾 NUL を除去）
3. `namespaces` に分割し、`SettingsIO::loadSettings(root)` でルート読込
4. 以降の要素を順に辿って対象 JSON オブジェクトを取得
5. `JsonStore::Sender` を構築し `DataTransferController::sendRequest(kEditorAppMacAddress, sender)` を呼び出し
6. セッション開始/失敗をログ出力

送信処理は `Timer(10ms)` により非同期で実行されます。

## 使用例（登録）
```cpp
auto client = std::make_shared<synthevery::SettingsConfigCommandClient>(
  CommandModule::ClientID::kEditorSettingsConfig,
  data_transfer_module->getDataTransferController(),
  core->getFastloopTimerList(),
  settings_io);

command_module->getCommandDispatcher()
  ->getCommandHandler(WirelessConnectionModule::kEditorAppMacAddress, true)
  ->setClientInterface(client);
```

## エラー/ログ
- 空パス/不正パス/未存在パスは `WARN`
- 設定読込失敗は `ERROR`/`WARN`
- 送信開始時は `INFO`（セッションID出力）

## 依存
- `Synthevery/AppModule/SettingsIOModule.h`（`SettingsIO`）
- `Synthevery/DataTransfer/DataTransferController.h`
- `Synthevery/AppModule/ConnectionModule.h`（宛先アドレス）
- `Synthevery/Core/Timer.h`, `Synthevery/Core/Log.h`
