# Webアプリ TickClock 移植ガイドライン（AppStateSync フォロワ専用）

## 1. 目的・スコープ
- 目的: Webアプリ（NextJS/ブラウザ）で、デバイスと同等の `TickClock` を実装し、既存の AppStateSync による `TickClockState` 配信を受けてローカルの再生ティックを駆動する。
- スコープ: Webはリーダーにならない（配信は行わず受信のみ）。`TickClockSyncNode` のメッシュブロードキャストは使用しない。

## 2. 前提・依存
- 時刻源は Web 実装済みの `SyncTime` を使用（TimeSyncによりデバイス基準に同期）。
- メッシュ層で AppStateSync の購読/受信が可能。
- デバイス側は `AppStateIDs::Player::kTickClock` を配信済み。

## 3. 同期方式（方針）
- デバイス（リーダー）が AppStateSync で `TickClockState` を配信。
- Web（フォロワ）が受信し、ローカル `TickClock` に反映して駆動する。
- `kTickClockSync(0xFA)` のブロードキャストは使用しない（重複経路回避）。

## 4. データ仕様（AppStateSync: TickClockState）
- シリアライズ仕様（合計9バイト, little-endian）
  - `is_running`: uint8（1=走行, 0=停止）
  - `beat_per_minute`: float32
  - `origin_time_us`: uint32（μs, `SyncTime.micros()` 基準, 32-bit ラップ）
- デバイス実装（参照）
```26:44:synthevery/lib/Synthevery/src/Synthevery/Player/PlayerSyncStates.h
std::vector<uint8_t> serialize() const override {
  std::vector<uint8_t> data;
  data.reserve(sizeof(bool) + sizeof(float) + sizeof(uint32_t));
  data.push_back(value_.is_running ? 1 : 0);
  const uint8_t* float_ptr = reinterpret_cast<const uint8_t*>(&value_.beat_per_minute);
  data.insert(data.end(), float_ptr, float_ptr + sizeof(float));
  const uint8_t* uint32_ptr = reinterpret_cast<const uint8_t*>(&value_.origin_time_us);
  data.insert(data.end(), uint32_ptr, uint32_ptr + sizeof(uint32_t));
  return data;
}
```
```46:65:synthevery/lib/Synthevery/src/Synthevery/Player/PlayerSyncStates.h
bool receive(const uint8_t* data, size_t size) override {
  if (size < sizeof(bool) + sizeof(float) + sizeof(uint32_t)) { return false; }
  size_t offset = 0;
  value_.is_running = data[offset] != 0; offset += sizeof(bool);
  memcpy(&value_.beat_per_minute, data + offset, sizeof(float)); offset += sizeof(float);
  memcpy(&value_.origin_time_us, data + offset, sizeof(uint32_t));
  return true;
}
```

## 5. Web側 API 設計（TypeScript）
### 5.1 TickClock（フォロワ）
- 状態:
  - `origin_time_us: number (uint32)`
  - `beat_per_minute: number (float)`
  - `ticks_per_beat: number (float)` → デバイス既定 480 に合わせる
  - `is_running: boolean`
- API:
  - `constructor(timeBase: { micros(): number; millis(): number; seconds(): number }, bpm=120, tpb=480)`
  - `start() / pause()`
  - `setBeatPerMinute(bpm: number)` → origin再計算
  - `setTicksPerBeat(tpb: number)` → origin再計算
  - `getTick(): number` → `(micros - origin) * (bpm/60 * tpb)`（走行中のみ更新）
  - `setState(state)` / `getState()`
  - `onStateChanged: Signal<TickClockState>`（任意）
- origin再計算（デバイス実装と整合）
```111:120:synthevery/lib/Synthevery/src/Synthevery/Player/Sequencer/TickClock.h
state_.origin_time_us = _time->micros() - current_tick_ / ticks_per_second_ * 1.0e6;
```

### 5.2 AppState アダプタ（購読のみ）
- `subscribe(AppStateIDs.Player.kTickClock, (payload: Uint8Array) => { ... })`
- 受信で 9バイト（厳密）をデコードし、`tickClock.setState({ is_running, beat_per_minute, origin_time_us, ticks_per_beat: 480 })` を適用。
- `is_running` に合わせて `start()/pause()` 切替。

## 6. バイナリ読取（TSヘルパ）
```ts
export function readF32LE(view: DataView, o: number): number { return view.getFloat32(o, true); }
export function readU32LE(view: DataView, o: number): number { return view.getUint32(o, true) >>> 0; }
export function decodeTickClockStateAppState(buf: ArrayBuffer) {
  if (buf.byteLength !== 9) throw new Error(`TickClockState len=${buf.byteLength}`);
  const v = new DataView(buf);
  const is_running = new Uint8Array(buf)[0] !== 0;
  const bpm = readF32LE(v, 1);
  const origin = readU32LE(v, 5);
  return { is_running, beat_per_minute: bpm, origin_time_us: origin };
}
```

## 7. 動作フロー（Web フォロワ）
1) `const tickClock = new TickClock(syncTime, 120, 480)` を生成（初期は pause）。
2) AppStateSync に購読登録。
3) 初回受信: `setState()` → `is_running` に応じて `start()/pause()`。
4) 以降、受信都度 `setState()`（BPM 変更・一時停止/再開・origin 更新）。

## 8. 相互運用・整合性
- `ticks_per_beat` は 480 で一致させる（AppStateには含まれない）。
- エンディアン: little固定（float/uint32）。
- `origin_time_us` は `uint32` ラップ。TSでは `>>> 0` で扱う。
- 時刻源は `SyncTime` を使用（`performance.now()` 生値ではなく、必ず同期時刻）。

## 9. トラブルシューティング
- 受信長 `!= 9` → AppState配線の取り違え/バージョン差。デバイス側 `serialize()` と整合を確認。
- `ticks_per_beat` 不一致 → ティック差が累積。Web/デバイス双方480に統一。
- 同期直後の飛び → `SyncTime` 未同期。時刻同期完了後に `TickClock` を有効化。
- ラップ境界 → `origin_time_us` は32bit。差分計算であれば継続運用で安定。

## 10. 参考（デバイス側コード）
- TickClock（ティック計算・origin更新・状態通知）
```42:121:synthevery/lib/Synthevery/src/Synthevery/Player/Sequencer/TickClock.h
class TickClock : public TickBase {
  struct TickClockState { uint32_t origin_time_us; float beat_per_minute; float ticks_per_beat; bool is_running; };
  void update() {
    if (state_.is_running) {
      uint32_t current_time_us = _time->micros();
      current_tick_ = (current_time_us - state_.origin_time_us) * 1.0e-6 * ticks_per_second_;
    }
  }
  void updateOriginTime() {
    state_.origin_time_us = _time->micros() - current_tick_ / ticks_per_second_ * 1.0e6;
    on_state_changed_signal_.emit(state_);
  }
}
```
- TickClockState（AppStateSync シリアライズ/デシリアライズ）
```15:43:synthevery/lib/Synthevery/src/Synthevery/Player/PlayerSyncStates.h
struct TickClockState { bool is_running; float beat_per_minute; uint32_t origin_time_us; };
... // serialize()/receive() はセクション4を参照
```
- 定数（参考: TickClockSync は今回不使用）
```71:84:synthevery/lib/Synthevery/src/Synthevery/AppModule/ConnectionModule.h
constexpr static uint8_t kTickClockSync = 0xFA;
```

---
Webがリーダーにならない前提で、AppStateSyncのみで `TickClock` をフォロワ同期する最小構成を示す。`SyncTime` により時間基準が一致していれば、ティック位相は安定的に整合する。
