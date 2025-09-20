# Web向け CRDT ループシーケンス同期 仕様書

## 1. 目的 / 範囲
- WebクライアントをMeshネットワーク上の等価ピアとして扱い、デバイス群とリアルタイムにループシーケンス（最大8トラック）をCRDTで同期する。
- 既存のWeb基盤（Mesh、PayloadCommand、DataTransfer、LeaderElection）を利用する。
- Leaderは既存の仕組みで判定可能（最小MACがLeader）。Web側のMACアドレスは既に提供済みの値を使用する。
- スコア/シーケンサは未実装のため、投影はUIイベント（仮想スコア）で代替する。

非対象:
- 音源再生や実オーディオ処理の仕様化。
- 高度なUI設計・最適化詳細。

## 2. 用語
- CRDT: Conflict-free Replicated Data Type。
- OR-Set: Observed-Remove Set。Add/Removeの観測情報で整合性を保つ集合。
- NoteID: (mac: 8bytes, timestampUs: 4bytes)。

## 3. データモデル
- トラック数: 8（`kNumTracks`、将来拡張可）。
- 要素: `CRDTNoteOp`（Add/Remove、Instrument/Effect）。
- 軽量ハッシュ: `noteHash`（CRC32、O(1)でXOR累積更新）。
- トラック状態: `addSet`（NoteID→最新Add op）, `removeSet`（NoteID集合）、`addHashXor`/`removeHashXor`。

### 3.1 CRDTNoteOp フォーマット（26バイト固定 / ワイヤ）
```
mac(8, BE) | timestampUs(4, LE) | noteHash(4, LE) | trackIndex(1) | opType(1)
| tick(4, LE) | noteType(1) | payload(3)

payload(Instrument): channel(1), note_num(1), velocity(1)
payload(Effect)    : channel(1), effect_id(1), value(1)
```

## 4. 通信仕様
- リアルタイム操作: PayloadCommand `kCRDTSequence` で `CRDTNoteOp` 単発送受信。
- ハッシュ監査: PayloadCommand `kCRDTHashAudit`。
  - Leaderのみ2秒間隔で全接続ピアへ要求。
  - 応答は `[num(1)] + { track(1), addXor(4,LE), rmXor(4,LE) } * num`。
  - 連続 `mismatch_threshold` 回（デフォルト3）不一致でフル同期を起動。
- フル同期: DataTransfer `kCRDTFullState` のバイナリ。
  - ヘッダ: `numTracks(1)`。
  - 各トラック: `addCount(2,LE)` + 26B op * addCount + `rmCount(2,LE)` + (mac8+ts4) * rmCount。

## 5. 設定
```
crdt.hash_audit_interval_ms: number (default 2000)
crdt.hash_mismatch_threshold: number (default 3)
crdt.suppress_duplicates: boolean (default false)
```
- 監査間隔・閾値は起動時に反映。重複抑制ON時は受信Addをガード。

## 6. Web側コンポーネント
### 6.1 CRDTTypes（ts/wasm）
- 列挙: `CRDTOpType`, `CRDTNoteType`。
- 構造: `CRDTNoteOp`。
- 直列化/復号: 上記26B固定フォーマット（endian準拠）。
- ハッシュ: `generateNoteHash(op: CRDTNoteOp): uint32`（CRC32）。

### 6.2 CRDTTrackSet
- `adds: Map<NoteID, NoteEntry>`（NoteEntryは最新Add op）。
- `removes: Set<NoteID>`、`addHashXor`, `removeHashXor`。
- `add(op)`, `remove(op)`, `exists(id)`。

### 6.3 CRDTSequenceState
- 8トラックの `CRDTTrackSet` を保持。
- `applyOp(op)`、`buildHashReports()`、`buildFullStateBinary()`、`applyFullStateBinary(buf)`。
- 検索: `findActiveInstrumentNote(track,tick,note)` / `findActiveEffectNote(...)`。
- 投影フック: `onProjection(track, instrumentNotes[], effectNotes[])`（フル同期適用時）。

### 6.4 CRDTSequenceCommandClient（Web）
- `sendTo(peer, op)`、`broadcast(op)`、`onReceive(op)`（受信時コールバック）。

### 6.5 CRDTHashAuditClient（Web）
- 受信: レポートビルド→ACK返却。
- Leader時: 2秒ごとに要求→しきい値超過でフル同期送出。

### 6.6 CRDTFullStateReceiverPort（Web）
- DataTransfer受信→`applyFullStateBinary`→`onProjection`発火。

### 6.7 CRDTSequenceModule（Web）
- 監査タイマ開始/停止、Leader確認、フル同期トリガ。
- 設定反映（監査間隔、閾値、重複抑制）。

### 6.8 ProjectionAdapter（仮想スコア）
- Score/Sequencer未実装のため、UIへ以下を通知:
  - Add/Remove受信での差分イベント
  - フル同期適用での全量イベント
- WebUI操作→`commitInstrument/commitEffect`（Add）・`remove*`（Remove）へ委譲。

## 7. Web API（I/F）
```ts
type InstrumentNote = { channel: number; note_num: number; velocity: number };
type EffectNote = { channel: number; id: number; value: number };

interface CRDTWeb {
  init(ctx: { mesh: Mesh; command: CommandDispatcher; dt: DataTransfer;
              leader: LeaderElector; settings: SettingsStore; myMac: MacAddress }): void;
  onProjection(cb: (track: number, instruments: Array<[tick:number, InstrumentNote]>,
                   effects: Array<[tick:number, EffectNote]>) => void): void;
  onRealtime(cb: (op: CRDTNoteOp) => void): void;

  commitInstrument(tick: number, n: InstrumentNote): void; // Add
  commitEffect(tick: number, n: EffectNote): void;         // Add
  removeInstrument(tick: number, n: InstrumentNote): void; // Remove（OR-Set検索）
  removeEffect(tick: number, n: EffectNote): void;         // Remove

  getHashes(): Array<{ trackIndex: number; addXor: number; removeXor: number }>;
  fullSyncTo(peer: MacAddress): void; // Leader用
}
```

備考: `myMac` はWeb基盤が提供するMACアドレスをそのまま使用する（新規生成不要）。

## 8. 動作フロー
1) ローカルAdd: `commit*` → NoteID=(myMac, now)→`noteHash`→OR-Set適用→broadcast。
2) 受信Add/Remove: 重複抑制ON時は `findActive*` でガード→OR-Set適用→差分をUIへ通知。
3) 監査: Leaderのみ2秒間隔。閾値到達で `fullSyncTo` 実行。
4) フル同期受信: `applyFullStateBinary`→`onProjection`でUI更新。

## 9. エッジケース / エラー処理
- ネットワーク断: 監査はLeaderの接続ピアに限定。再接続後に監査→フル同期で収束。
- 二重Add: 重複抑制ONでUI二重表示防止。OFFでもOR-Set的には同IDは一意。
- Remove遅延: tombstone勝ちのため整合は保たれる。

## 10. テスト計画
- 直列化/復号の相互互換（デバイス⇔Web）。
- OR-Set整合（Add/Remove順序シャッフル、遅延/重複）。
- 監査ミスマッチ→フル同期回復。
- 重複抑制ON/OFFのUI表示の差。

## 11. バージョニング / 互換性
- 26Bオペコード/フル状態バイナリは固定長・明示エンディアンで後方互換を確保。
- 新フィールドの追加は別メッセージ種別として拡張する。

## 12. ログ / 監視
- 起動時に監査間隔・閾値・重複抑制設定をINFOで出力。
- 監査ミスマッチ・フル同期トリガ・重複抑制スキップはDEBUG/INFOで記録。



