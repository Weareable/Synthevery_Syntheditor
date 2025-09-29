## Web版 CRDT ループシーケンス同期 移植計画（デバイス実装準拠）

### 目的と範囲
- **目的**: デバイス側で実装済みの CRDT（OR-Set）ベースのループシーケンス同期を Web クライアントへ移植し、相互運用可能なリアルタイム同期を実現する。
- **範囲**: OR-Set コア、DTO/MsgPack 直列化、コマンド送受（差分/監査/フル同期）、UI/Sequencer 結線、設定、テスト、ドキュメント。
- **準拠**: デバイス仕様（通信/DTO/タイミング）は可能な限り同等。差異は本ドキュメントに明記。

参考: Web リポジトリ [`Synthevery_Syntheditor`](https://github.com/Weareable/Synthevery_Syntheditor)

### 実装フェーズ
1. 基盤
   - OR-Set コア（勝者選出・投影差分・XOR ハッシュ・オンラインコンパクション API の骨格）
   - DTO/MsgPack 往復（CRDTNote/Delta/FullState）
   - 単体テスト（OR-Set 整合、DTO 往復）
2. 通信
   - Command クライアント: `kCRDTSequence`（差分）、`kCRDTHashAudit`（監査）、`kCRDTFullState`（フル状態）
   - DataTransfer/Dispatcher への登録・ルーティング
   - 疑似 E2E テスト（監査→不一致→フル同期要求→ACK）
3. UI/Sequencer 結線
   - 投影差分を tick 境界で UI/Sequencer に適用（半開区間の削除、idempotent upsert）
   - 既存 Hooks と最小限の結線
4. 設定・ドキュメント
   - 設定ツリー `crdt.audit/gc/sequence` の追加
   - 仕様書更新（本書、Web 仕様書）

### 追加/変更ファイル（案）
- CRDT コア
  - `syntheditor/lib/crdt/types.ts`：`NoteID`（6B `P2PMacAddress` 準拠）、`NoteType`、`MusicalPosition`、`InstrumentNote`、`EffectNote`、`CRDTNote`
  - `syntheditor/lib/crdt/p2p-mac.ts`：6 バイト MAC の等価/バイナリ変換/ハッシュ
  - `syntheditor/lib/crdt/orset.ts`：`add/remove/clear/applyCompaction`、勝者選出、`popProjectionDeltas`、`buildFullProjection`、`addHashXor/removeHashXor`
- DTO/MsgPack
  - `syntheditor/lib/crdt/dto.ts`：`NoteIDMsg`/`InstrumentNoteMsg`/`EffectNoteMsg`/`CRDTNoteMsg`/`CRDTDeltaMsg`
  - `syntheditor/lib/crdt/msgpack.ts`：`encodeDelta`/`decodeDelta`、`packNotes`/`unpackNotes`
- Command/DataTransfer
  - `syntheditor/lib/synthevery-core/command/constants.ts`：`kCRDTSequence`/`kCRDTHashAudit`/`kCRDTFullState` 追加
  - `syntheditor/lib/synthevery-core/command/crdt-sequence-client.ts`
  - `syntheditor/lib/synthevery-core/command/crdt-audit-client.ts`
  - `syntheditor/lib/synthevery-core/data-transfer/crdt-full-state.ts`
  - `syntheditor/lib/synthevery-core/appstate/command-clients.ts`：クライアント登録
- UI/Sequencer 結線
  - `syntheditor/lib/crdt/score-bridge.ts`：投影差分→ UI/Sequencer 反映（tick 境界適用）
  - 既存 hooks（例 `hooks/useTickClock.ts`, `hooks/useTrackConfig.ts`）に最小変更
- 設定
  - `syntheditor/lib/synthevery-core/device/config.ts`：`crdt.audit/gc/sequence` ネスト設定
- テスト（Jest）
  - `syntheditor/__tests__/crdt/orset.spec.ts`
  - `syntheditor/__tests__/crdt/dto-msgpack.spec.ts`
  - `syntheditor/__tests__/crdt/audit-flow.spec.ts`

### DTO/MsgPack 互換要件
- `NoteIDMsg`：MAC 6B（バイナリ）、`timestamp` は 32-bit 符号なし
- `InstrumentNoteMsg`/`EffectNoteMsg`：デバイスと同一のフィールド順・型
- `CRDTNoteMsg`：`type`（0=Instrument,1=Effect）、`pos`、`id`、`payload`
- `CRDTDeltaMsg`：`track`、`op`（0=add,1=remove）、`note` または `id`
- フル状態: `CRDTNoteMsg` 配列
- MsgPack のフィールド順・配列サイズはデバイス実装に一致させる

### 適用タイミング/結線ポリシー
- 差分適用はグローバル tick の境界で実施
- 削除レンジは半開区間（例：`[tick, tick+1)`）
- upsert 前に当該位置の勝者削除を先行させ idempotent を担保

### 監査/フル同期ポリシー
- Leader 駆動 RR 監査（`max_peers_per_cycle` 限定）
- `mismatch_threshold` 連続不一致でフル同期要求
- フル同期適用後は `cooldown_cycles` 抑制
- 受信側適用完了で軽量 ACK を返信

### 設定キーパス（例）
```json
{
  "crdt": {
    "audit": { "interval_ms": 1000, "max_peers_per_cycle": 2, "mismatch_threshold": 2, "cooldown_cycles": 4 },
    "gc": { "enabled": false, "interval_ms": 10000 },
    "sequence": { "apply_at_tick_boundary": true, "max_deltas_per_cycle": 64 }
  }
}
```

### テスト計画（Jest）
- OR-Set 整合: 追加/置換、同時候補、削除再選、連続削除、多数ノート性能スモーク
- DTO/MsgPack 往復: `CRDTNoteMsg`/`CRDTDeltaMsg`、フル投影配列
- 監査フロー: XOR ハッシュ一致/不一致→閾値到達→フル同期要求→ACK まで

### リスクと対策
- 互換性崩れ: DTO/MsgPack のフィールド順・型を単体テストでスナップショット固定
- 送信スパム: 差分スロットリング/バッチ化（同位置は最新のみ）
- UI 一貫性: tick 境界適用＋idempotent upsert で安定化

### トレーサビリティ/ブランチ運用
- ブランチ: `feat/issue14/add-crdt-sequence-sync`
- コミット規約: `feat(crdt-web): ...` / `test(crdt-web): ...` / `docs(crdt-web): ...`
- PR: フェーズごと（基盤→通信→UI→設定/文書）

### フェーズ別タスク（抜粋）
1. 基盤
   - `types.ts`/`p2p-mac.ts`/`orset.ts` を追加
   - `dto.ts`/`msgpack.ts` を追加
   - `__tests__/crdt/orset.spec.ts`・`dto-msgpack.spec.ts` を追加
2. 通信
   - `command/constants.ts` に CRDT 定数を追加
   - `crdt-sequence-client.ts`・`crdt-audit-client.ts`・`crdt-full-state.ts` を追加
   - `appstate/command-clients.ts` に登録
   - `__tests__/crdt/audit-flow.spec.ts` を追加
3. UI/Sequencer
   - `score-bridge.ts` を追加、最小限の hooks 結線
4. 設定/ドキュメント
   - 設定反映、仕様書（本書含む）を更新

---
本計画に従い、まずフェーズ1（基盤）から実装を開始する。


