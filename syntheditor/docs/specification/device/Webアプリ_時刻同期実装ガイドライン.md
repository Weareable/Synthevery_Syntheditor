# Webアプリ 時刻同期（SyncTime）実装ガイドライン

## 1. 目的・スコープ
- 目的: Webアプリ（NextJS/ブラウザ実行）が、デバイス群の「最古ノード（oldest node）」と直接NTP方式の往復測定を行い、デバイス側 `SyncTime` と互換の時刻同期を実現する。
- スコープ: ドキュメントのみ。デバイス側コードの変更は不要。Web側は既存のメッシュ通信・コマンド・ロール管理基盤を前提とする。

## 2. 前提・依存
- Webアプリはメッシュ層で対象デバイス（oldest node）と接続済み（送受信可能）であること。
- Webアプリは「最古ノード（基準ノード）」の MAC アドレスを把握できること。
- ペイロードはバイナリ、little-endian、`uint32` ラップを前提（デバイス互換）。

## 3. 定数（デバイス互換値）
- MeshPacketType
  - kTimeSync = `0xFB`
  - kCommand  = `0xF9`（本手順では不要だが参照用）
- CommandModule.ClientID
  - kTimeSync = `0x04`（本手順では不要だが参照用）

備考: 本ガイドラインの方式は“Web自発同期”のためコマンド配信は不要。将来、レジストリ連携してTimeSyncCommander経由での一斉同期に参加する場合に利用。

## 4. バイナリプロトコル仕様（互換）
- Client → Server: TimeSynchronizeClientData
```
struct TimeSynchronizeClientData {
  uint8_t index; // 0..(num_commands-1) + current_command_index
};
```
- Server → Client: TimeSynchronizeServerData
```
// little-endian, 各32bitはuint32でラップ
struct TimeSynchronizeServerData {
  uint32_t t1;            // server 受信時刻（μs）
  uint32_t t2;            // server 送信直前時刻（μs）
  uint8_t  index;         // エコーバック（一致チェックに使用）
  uint32_t current_offset;// server の SyncTime 現在オフセット（μs）
};
```

## 5. 時刻単位と数値扱い
- 単位は μs（マイクロ秒）。デバイスは `uint32` でラップ（オーバーフロー）する。
- Webの時間源は `performance.now()` 推奨。
  - `micros = Math.floor(performance.now() * 1000) & 0xffffffff`
  - `millis = Math.floor(micros / 1000)`
  - `seconds = micros / 1_000_000`
- 受送信の `uint32` は little-endian でエンコード/デコードすること。

## 6. 同期アルゴリズム（NTP方式）
- 1往復の測定で以下を取得:
  - `t0`: Client 送信直前（μs）
  - `t1`: Server 受信（μs）
  - `t2`: Server 送信直前（μs）
  - `t3`: Client 受信（μs）
- オフセット算出（1サンプル）:
  - `offset_i = ((t1 - t0) + (t2 - t3)) / 2`
- 複数回（推奨 8 回）実施し、IQR（四分位範囲）で外れ値を除去後、平均をとる。
- 最終オフセット:
  - `final_offset = avg(offset_i_filtered) + base_offset`
  - `base_offset` は Server から受け取る `current_offset`（連鎖基準のため）。

## 7. メッセージフロー（Web自発同期）
1) Web クライアントは oldest node の MAC を既知として、同期先アドレスを保持。
2) Web で `startSynchronize(oldest)` を呼ぶ。
3) 繰り返し（`num_commands` 回、推奨 8 回）
  - `index = current_index + offset`
  - `t0 = baseTime.micros()` を記録
  - `ClientData{index}` を kTimeSync で送信
  - 返信（ServerData）を受信したら `t3 = baseTime.micros()` を記録し、`t1,t2,index,current_offset` を取り込む
  - `index` 不一致ならリセット（測定やり直し）
4) 規定回数分データが揃ったら `TimeSynchronizer.updateOffset(samples, base_offset)` を呼び、`SyncTime.setOffset(final_offset)` を更新。

サーバ（デバイス）側の動作（参考）:
- ClientData を受け取ると、即時に `t1=received_time`、`t2=now()`、`index=echo`、`current_offset=SyncTime.getOffset()` を返す。

## 8. 推奨クラス構成（TypeScript例・擬似API）
- SyncTime
  - `constructor(base: { micros(): number; millis(): number; seconds(): number }, offsetUs = 0)`
  - `setOffset(us: number)`, `getOffset(): number`
  - `micros()/millis()/seconds()` は `base + offset` を返す
- TimeSynchronizer
  - `constructor(syncTime: SyncTime)`
  - `updateOffset(samples: {t0:number,t1:number,t2:number,t3:number}[], baseUs:number)`
    - NTP式 + IQR 外れ値除去 → 平均 → `syncTime.setOffset()`
- TimeSyncNode
  - `constructor(timeSync: TimeSynchronizer, mesh: MeshPacketHandler, packetType = 0xFB, numCommands = 8)`
  - `startSynchronize(target: P2PMacAddress)`
  - `receiveData(address: P2PMacAddress, data: Uint8Array)`
  - `onSyncComplete: Signal<void>`

注意点:
- `index` 整合性を厳密に確認。不整合時は測定をリセット。
- サンプル蓄積が完了するまで `sendClientData()` を反復。
- 受信側で ClientData を受け取った場合は ServerData を速やかに返す（Web側にサーバ実装が必要な場合のみ）。

## 9. エラーハンドリング・再試行
- タイムアウト: 応答が一定時間内に来なければ、その試行を無効化して再送。
- 不整合: `index` 不一致時はリセット。
- 接続断: `isConnected(target)` を事前/各回で確認。未接続時は中止/再接続待ち。
- 外れ値: IQR により除外。サンプル数が閾値未満なら“外れ値除去なしの平均”で代替。

## 10. セキュリティ・整合性
- メッシュ層の接続管理（許可済みピアのみ）。
- 受信パケット長・型を必ず検証（`sizeof(ClientData/ServerData)`）。
- Little-endian/`uint32` ラップの扱いを統一。

## 11. 実装チェックリスト
- [ ] kTimeSync (=0xFB) を用いたバイナリ送受信ができる
- [ ] ClientData/ServerData の構造・順序・サイズが互換
- [ ] μs 時刻の `uint32` ラップを考慮している
- [ ] 8回往復・IQR 外れ値除去・平均の実装
- [ ] `final_offset = avg + base_offset` を適用
- [ ] `SyncTime` のオフセット更新後、アプリ内の既存時間参照が同期時刻を使う
- [ ] 接続断・タイムアウト・不整合の再試行ロジック
- [ ] E2E: oldest node 宛てに直同期でオフセットが安定すること

## 12. 将来拡張（任意）
- 測定回数/窓長の動的調整、遅延統計の可視化。

## 13. 参考（デバイス側実装）
- `lib/Synthevery/src/Synthevery/Connection/TimeSynchronizer.h/.cpp`（NTP式/IQR/avg）
- `lib/Synthevery/src/Synthevery/Connection/TimeSynchronizer.h` の `TimeSyncNode`（t0..t3収集・index整合・反復）
- `lib/Synthevery/src/Synthevery/AppModule/ConnectionModule.h`（MeshPacketType 定義）
- `lib/Synthevery/src/Synthevery/AppModule/TimeSyncModule.h`（周期同期・Commander連携の全体像）

## 14. Web実装ヘルパー（TypeScript例）
```ts
// uint32 little-endian read/write
export function readU32LE(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}
export function writeU32LE(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value >>> 0, true);
}

// uint32 wrap helper
export function wrapU32(x: number): number {
  return x >>> 0;
}

// IQR filter (returns filtered array)
export function iqrFilter(values: number[]): number[] {
  if (values.length < 4) return values.slice();
  const sorted = values.slice().sort((a, b) => a - b);
  const n = sorted.length;
  const q1 = sorted[Math.floor(n / 4)];
  const q3 = sorted[Math.floor((n * 3) / 4)];
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  return sorted.filter((v) => v >= lo && v <= hi);
}

// time base using performance.now()
export class PerfTimeBase {
  micros(): number { return wrapU32(Math.floor(performance.now() * 1000)); }
  millis(): number { return Math.floor(this.micros() / 1000); }
  seconds(): number { return this.micros() / 1_000_000; }
}

// Binary structures
export function encodeClientData(index: number): Uint8Array {
  const buf = new Uint8Array(1);
  buf[0] = index & 0xff;
  return buf;
}
export function decodeServerData(buf: ArrayBuffer) {
  const view = new DataView(buf);
  return {
    t1: readU32LE(view, 0),
    t2: readU32LE(view, 4),
    index: new Uint8Array(buf)[8],
    current_offset: readU32LE(view, 9),
  };
}
```

## 15. デバイス側コード抜粋（実装引用）
### 15.1 MeshPacketType 定義（定数）
```71:84:synthevery/lib/Synthevery/src/Synthevery/AppModule/ConnectionModule.h
  class MeshPacketType {
   public:
    constexpr static uint8_t kDeviceType = 0xFE;
    constexpr static uint8_t kRelativeLeader = 0xFD;
    constexpr static uint8_t kAppState = 0xFC;
    constexpr static uint8_t kTimeSync = 0xFB;
    constexpr static uint8_t kTickClockSync = 0xFA;
    constexpr static uint8_t kCommand = 0xF9;
    constexpr static uint8_t kSensorData = 0xF8;
    constexpr static uint8_t kMotionData = 0xF7;
    constexpr static uint8_t kPeerDistance = 0xF6;
    constexpr static uint8_t kDataTransferData = 0xF5;
    constexpr static uint8_t kDataTransferAck = 0xF4;
  };
```

### 15.2 NTPオフセット算出（IQR外れ値除去）
```26:91:synthevery/lib/Synthevery/src/Synthevery/Connection/TimeSynchronizer.h
  void updateOffset(const std::vector<TimeSynchronizeReferences>& data,
                    uint32_t base_offset) {
    if (data.size() >= 8) {
      std::vector<int64_t> offsets;
      offsets.reserve(data.size());

      for (auto d : data) {
        int64_t offset = ((int64_t(d.t1) - int64_t(d.t0)) +
                          (int64_t(d.t2) - int64_t(d.t3))) /
                         2;
        offsets.push_back(offset);
      }

      // Sort offsets
      std::sort(offsets.begin(), offsets.end());

      // Calculate first and third quartiles (Q1 and Q3)
      size_t n = offsets.size();
      int64_t q1 = offsets[n / 4];
      int64_t q3 = offsets[n * 3 / 4];

      // Calculate IQR (Interquartile Range)
      int64_t iqr = q3 - q1;

      // Define lower and upper bounds for outlier detection
      int64_t lower_bound = q1 - 1.5 * iqr;
      int64_t upper_bound = q3 + 1.5 * iqr;

      // Remove outliers and calculate the average offset
      int64_t offset_sum = 0;
      size_t valid_count = 0;

      for (int64_t offset : offsets) {
        if (offset >= lower_bound && offset <= upper_bound) {
          offset_sum += offset;
          valid_count++;
        }
      }

      if (valid_count > 0) {
        int64_t avg_offset = offset_sum / valid_count;
        sync_time_->setOffset(uint32_t(avg_offset) + base_offset);

        ESP_LOG_LEVEL(ESP_LOG_DEBUG, log_tags::kTimeSync,
                      "Calc Offset: %d, Base Offset: %d", avg_offset,
                      base_offset);
      }

    } else {
      int64_t time_offset_sum = 0;

      for (auto d : data) {
        time_offset_sum += ((int64_t(d.t1) - int64_t(d.t0)) +
                            (int64_t(d.t2) - int64_t(d.t3))) /
                           2;
      }

      auto offset_ = time_offset_sum / data.size();
      sync_time_->setOffset(uint32_t(offset_) + base_offset);

      ESP_LOG_LEVEL(ESP_LOG_DEBUG, log_tags::kTimeSync,
                    "Calc Offset: %d, Base Offset: %d", offset_, base_offset);
    }
  }
```

### 15.3 送受信とt0..t3収集（クライアント/サーバ処理）
```24:43:synthevery/lib/Synthevery/src/Synthevery/Connection/TimeSynchronizer.cpp
void TimeSyncNode::sendClientData() {
  // send time sync request
  TimeSynchronizeClientData data{
      .index = uint8_t(current_command_index_ + current_command_index_offset_)};

  time_sync_data_[current_command_index_offset_].t0 =
      time_synchronizer_->getBaseTime()->micros();

  mesh_packet_handler_->sendPacket(time_sync_ref_packet_type_,
                                   sync_server_address_, (uint8_t*)&data,
                                   sizeof(data));
}
```

```45:86:synthevery/lib/Synthevery/src/Synthevery/Connection/TimeSynchronizer.cpp
void TimeSyncNode::receiveData(const P2PMacAddress& address,
                               const uint8_t* data, size_t length) {
  uint32_t received_time = time_synchronizer_->getBaseTime()->micros();
  if (length == sizeof(TimeSynchronizeClientData)) {
    TimeSynchronizeClientData* client_data = (TimeSynchronizeClientData*)data;
    TimeSynchronizeServerData server_data{
        .t1 = received_time,
        .t2 = time_synchronizer_->getBaseTime()->micros(),
        .index = client_data->index,
        .current_offset = time_synchronizer_->getSyncTime()->getOffset()};
    mesh_packet_handler_->sendPacket(time_sync_ref_packet_type_, address,
                                     (uint8_t*)&server_data,
                                     sizeof(server_data));
    return;
  }

  uint32_t base_offset = 0;

  if (length == sizeof(TimeSynchronizeServerData)) {
    TimeSynchronizeServerData* server_data = (TimeSynchronizeServerData*)data;
    if (server_data->index !=
        current_command_index_ + current_command_index_offset_) {
      reset();
      return;
    }

    time_sync_data_[current_command_index_offset_].t1 = server_data->t1;
    time_sync_data_[current_command_index_offset_].t2 = server_data->t2;
    time_sync_data_[current_command_index_offset_].t3 = received_time;
    base_offset = server_data->current_offset;
  }

  current_command_index_offset_++;
  if (current_command_index_offset_ >= num_commands_) {
    time_synchronizer_->updateOffset(time_sync_data_, base_offset);
    on_sync_complete_signal_.emit();
    reset();
    return;
  }

  sendClientData();
}
```

---
本ガイドラインは、デバイス側を変更せずにWebが自発的に同期する方式を第一選択とする。oldest node を把握できる前提が満たされていれば、即時導入可能。
