# PayloadCommandClient

`PayloadCommandClient` は `CommandClientInterface` を実装したヘッダオンリーのコマンドクライアントです。送信前にペイロードを登録し、`pushCommand(CommandID)` のタイミングで `generateData` から同一のバイト列を返すため、再送時にもペイロードが失われません。既存のディスパッチフローは変更不要です。

- セッションID: `CommandID.type` の 8bit を使用（0→255 を単調前進で自動採番）
- 各セッションは 1 つのペイロードを保持（deque 不使用）
- 完了/タイムアウトで解放するまで再送に同一データを提供

## API
- `PayloadCommandClient(uint8_t client_id, uint32_t wait_timeout_ms = 0)`
- `bool allocateAndPrepare(CommandID& out_cmd, const uint8_t* data, size_t size)`
- `bool allocateAndPrepare(CommandID& out_cmd, const std::vector<uint8_t>& data)`
- `bool cancel(uint8_t session_id)`
- `std::vector<uint8_t> generateData(const CommandID& id)`
- `std::pair<bool, std::vector<uint8_t>> handleData(...)`
- `bool handleAck(...)`
- `void onComplete(const CommandID& id)` / `void onTimeout(const CommandID& id)`
- `uint8_t getClientID() const`

## 拡張フック（protected virtual）
- `onBeforeGenerate(const CommandID&, const std::vector<uint8_t>&)`
- `selectWaitTimeoutMs(const CommandID&, uint32_t)`
- `onHandleAck(const CommandID&, const uint8_t*, size_t)`
- `onHandleData(const CommandID&, const uint8_t*, size_t)`
- `onAfterComplete(const CommandID&)` / `onAfterTimeout(const CommandID&)`
- `allocateSession(uint8_t& out, const std::bitset<256>& in_use, uint8_t next_start)`

## 使用例
```cpp
auto client = std::make_shared<synthevery::PayloadCommandClient>(kClientId);
handler->setClientInterface(client);

synthevery::CommandID cmd;
if (client->allocateAndPrepare(cmd, payload.data(), payload.size())) {
  auto sender = dispatcher->getCommandHandler(peer, false);
  sender->pushCommand(cmd);
}
```

## 並行性と待機
- 内部は `std::mutex`/`std::condition_variable` で保護
- 未準備で `generateData` が呼ばれた場合、`wait_timeout_ms` の間だけ待機（0 で即時）

## エラー
- 全 256 スロット使用中は `allocateAndPrepare` が false を返す
- 未準備のままタイムアウト時は空ベクトルを返し、再送で吸収

## 依存
- `Synthevery/Connection/CommandHandler.h`
