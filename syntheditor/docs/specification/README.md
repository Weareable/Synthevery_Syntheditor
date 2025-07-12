# Synthevery アプリケーション仕様書

## 概要

Syntheveryは、専用デバイス（Synthevery）を制御するためのWebアプリケーションです。複数のSyntheveryデバイスをMeshネットワークで接続し、音楽制作を協調的に行うことができます。

## 主要機能

- **BLE接続**: SyntheveryデバイスとのBluetooth Low Energy接続
- **Meshネットワーク**: 複数デバイス間の通信
- **音楽制作**: シンセサイザー、ドラムス、ベース、サンプラー機能
- **同期制御**: 複数デバイス間での状態同期
- **リアルタイム制御**: 演奏状態、BPM、メトロノーム等の制御

## ドキュメント構成

### 1. システム概要
- [概要・目的](./overview.md)

### 2. デバイス仕様
- [ハードウェア仕様](./device/hardware.md)
- [通信仕様](./device/communication.md)
- [音声処理仕様](./device/audio.md)

### 3. アプリケーション仕様
- [アーキテクチャ](./app/architecture.md)
- [機能仕様](./app/features.md)
- [UI/UX仕様](./app/ui-ux.md)

### 4. 技術仕様
- [通信プロトコル詳細](./technical/protocols.md)
- [開発環境・技術仕様](./technical/development.md)

### 5. コンポーネント仕様
- [楽器選択パネル](./app/components/instrument-select-panel.md)

### 6. 整合性チェック
- [整合性チェック結果](./consistency-check.md)

### 7. 既存仕様書
- [楽器選択パネル（旧版）](../main-panels/spec_instrument_select_panel.md)

## 更新履歴

- 2024年 - 初版作成

## 注意事項

- この仕様書は開発中であり、随時更新されます
- 実装と仕様に差異がある場合は、実装を優先します
- 技術的な詳細は各技術仕様ファイルを参照してください 