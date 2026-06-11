# Syntheveryアプリケーション 機能仕様

## 概要

Syntheveryアプリケーションは、複数のSyntheveryデバイスを制御し、協調的な音楽制作を可能にするWebアプリケーションです。各デバイスが異なる楽器パートを担当し、リアルタイムで同期しながら音楽を作成できます。

## 主要機能

### 1. デバイス接続・管理機能

#### BLE接続機能
- **デバイス検出**: Syntheveryデバイスの自動検出
- **接続確立**: BLE経由でのデバイス接続
- **接続状態監視**: リアルタイムでの接続状態表示
- **自動再接続**: 接続断時の自動再接続

#### Meshネットワーク機能
- **ネットワーク構築**: 複数デバイス間のMeshネットワーク構築
- **デバイス管理**: 接続済みデバイスの管理
- **通信状態表示**: ピア接続状態の表示
- **ネットワークトポロジ**: デバイス間の接続関係表示

### 2. 音楽制作機能

- **トラック管理**
  - 各デバイスは8トラックを持ち、各トラックの状態（ミュート、音量、ループ長など）を管理します。
  - 実装型例:
    ```typescript
    // 実装に合わせたTrackState
    interface TrackState {
      loopLengthTick: number; // ループ長（ティック）
      mute: boolean;          // ミュート
      volume: number;         // 音量
    }
    ```
  - 各デバイスが編集対象に含めるトラック集合を **TrackEditMask**（uint8 ビットフラグ）で管理します（v2、2026-06-05）。
    ```typescript
    type TrackEditMask = number; // bit N = track N
    type CurrentTracksState = Map<string, TrackEditMask>;
    ```
    **破壊的変更**: 旧 v1 は value = 単一 track index。FW v2 と同時デプロイ必須。詳細は FW リポ `docs/appstate/current_tracks_state_v2.md`。
  - 音色選択・シーケンス編集等は未実装（将来対応予定）

- **演奏制御・同期**
  - 再生/停止/BPM/メトロノーム/クオンタイザー/録音の状態をAppStateで管理します。
    ```typescript
    class PlayerSyncStates {
      metronomeState: SyncState<boolean>;
      tickClockState: ReadOnlySyncState<TickClockState>;
      recorderState: SyncState<boolean>;
      quantizerState: SyncState<boolean>;
      currentTracksState: SyncState<Map<string, number>>;
      trackStates: SyncState<Array<TrackState>>;
      devicePositions: SyncState<Map<string, number>>;
    }
    interface TickClockState {
      playing: boolean; // 再生中
      bpm: number;      // BPM
    }
    ```
  - BPM・再生状態・トラック状態・Position状態などは全デバイス間でリアルタイム同期されます。

- **未実装・将来機能**
  - 音色選択、シーケンス編集、エフェクト編集などは今後実装予定です。

### 3. メディアコントロール機能

- **再生制御・BPM・メトロノーム・クオンタイザー・録音**
  - MediaControlBarコンポーネント等でUI・状態管理を実装
  - 各状態はAppStateで同期され、全デバイスで一貫した制御が可能

### 4. 状態同期機能

- **アプリケーション状態同期**
  - プレイヤー状態、デバイス状態、トラック状態、Position状態などをAppStateで同期
  - 型例:
    ```typescript
    interface AppStateSync {
      player: TickClockState;
      devices: {
        connected: string[]; // 接続済みデバイス
        // roles: Map<string, string>; // デバイスロール（未実装）
      };
      tracks: Array<TrackState>;
      positions: Map<string, number>; // deviceIdごとのPosition（実装はnumber型）
    }
    interface TickClockState {
      playing: boolean; // 再生中
      bpm: number;      // BPM
    }
    ```
  - BPM同期、演奏状態同期、音量同期などをサポート

### 5. トラック管理機能

- 各デバイスは8つのトラックを持ち、トラックごとにミュート・音量・ループ長などを個別に設定できます（TrackState）。
- 演奏時は、各デバイスが **編集対象トラック集合**（TrackEditMask / CurrentTracksState v2）で管理します。
- 詳細仕様は [app/tracks.md](../tracks.md) を参照。

### 6. Position管理機能

- 各デバイスは「手持ち」「左腕」「右腕」「左足」「右足」などのPosition（装着位置）を持ち、devicePositionsStateで管理します。
- Position情報に応じて、デバイスは自律的に演奏モードやモーション検知方法を切り替えます。
- アプリ上ではPositionの設定のみ可能で、モード切替はデバイス側で行われます。
- 詳細仕様は [device/position-management.md](../device/position-management.md) を参照。

### 7. データ転送機能

- **音声データ転送**
  - SoundFontやサンプル音源、設定データの転送機能をサポート
  - 現状は基本的なデータ転送のみ実装、詳細な管理・UIは未実装

- **設定データ転送**
  - デバイス設定・ユーザー設定・プロジェクト設定の転送を想定（未実装）

### 8. ユーザーインターフェース機能

- **レスポンシブデザイン**: デスクトップ/タブレット/モバイル対応
- **テーマ機能**: ダーク/ライト/カスタムテーマ
- **アクセシビリティ**: キーボードナビゲーション、スクリーンリーダー、高コントラスト
- **主要UIコンポーネント**: MediaControlBar, DeviceStatusPanel, VerticalNavigationBar など

### 9. エラー処理・ログ機能

- **エラー処理**: 接続・通信・アプリケーションエラーのハンドリング（基本的な例外処理のみ実装、詳細なUI/ログは未実装）
- **ログ機能**: デバッグログ・エラーログ・パフォーマンスログ・ユーザーアクションログ（今後拡充予定）

### 10. 将来機能（予定）

- **AI機能**: 自動伴奏、音声認識、楽曲分析
- **クラウド機能**: プロジェクト同期、音声ライブラリ、コラボレーション
- **拡張機能**: プラグインシステム、MIDI対応、DAW連携

## 機能要件

### 必須機能
- [x] BLE接続機能
- [x] Meshネットワーク機能
- [x] 基本的な音楽制作機能（トラック管理・演奏制御・状態同期）
- [x] リアルタイム制御機能

### 推奨機能
- [ ] 高度な音声処理機能
- [ ] クラウド連携機能
- [ ] AI機能
- [ ] プラグインシステム

### 将来機能
- [ ] VR/AR対応
- [ ] 5G対応
- [ ] 量子コンピューティング対応 