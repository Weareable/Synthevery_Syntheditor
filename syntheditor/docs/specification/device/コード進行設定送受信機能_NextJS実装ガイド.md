# コード進行設定送受信機能 NextJS実装ガイド

## 概要

既存のNoteBuilderConfig送受信機能と同様の手法で、webアプリ（NextJS）側にコード進行設定送受信機能を実装するためのガイドです。

## 前提条件

- 既存のmesh通信、DataTransfer、Command基盤が構築済み
- NoteBuilderConfig等の各種コンフィグ送受信機能が実装済み
- デバイス側のコード進行設定送受信機能が実装済み

## コア機能実装

### 1. データタイプとコマンド定義

```typescript
// DataTypes.ts
export const DataTypes = {
  kChordScaleConfig: 15,  // 新規追加
} as const;

// DeviceControlCommand.ts
export const DeviceControlCommand = {
  kRequestChordScaleConfig: 0x16,  // 新規追加
} as const;
```

### 2. JSON構造

**送受信時のJSON構造（ルートレベル）:**
```json
{
  "scales": [
    {
      "notes": [0, 2, 4, 5, 7, 9, 11]
    }
  ],
  "chords": [
    {
      "notes": [0, 4, 7]
    }
  ],
  "chord_scale_relations": [
    {
      "chord_id": 0,
      "scale_with_root": {
        "scale_id": 0,
        "root_offset": 0
      }
    }
  ],
  "sequences": [
    {
      "tick": 0,
      "data": {
        "chord_ids": [0],
        "scale_with_roots": [
          {
            "scale_id": 0,
            "root_offset": 0
          }
        ]
      }
    }
  ],
  "loop_length_tick": 1920
}
```

**settings.json内の構造（player.chord_scale下）:**
```json
{
  "player": {
    "chord_scale": {
      "scales": [...],
      "chords": [...],
      "chord_scale_relations": [...],
      "sequences": [...],
      "loop_length_tick": 1920
    }
  }
}
```

### 3. DataTransferクライアント拡張

```typescript
// dataTransferClient.ts
export class DataTransferClient {
  async requestChordScaleConfig(): Promise<ChordScaleConfig> {
    return this.requestConfig(
      DataTypes.kChordScaleConfig,
      'chord_scale_config'
    );
  }

  async sendChordScaleConfig(config: ChordScaleConfig): Promise<void> {
    return this.sendConfig(
      DataTypes.kChordScaleConfig,
      'chord_scale_config',
      config
    );
  }
}
```

### 4. Commandクライアント拡張

```typescript
// commandClient.ts
export class CommandClient {
  async requestChordScaleConfig(): Promise<void> {
    return this.sendCommand(
      DeviceControlCommand.kRequestChordScaleConfig,
      new Uint8Array(0)
    );
  }
}
```

### 5. 型定義

```typescript
// types/chordScale.ts
export interface Scale {
  notes: number[];
}

export interface Chord {
  notes: number[];
}

export interface ScaleWithRoot {
  scale_id: number;
  root_offset: number;
}

export interface ChordScaleRelation {
  chord_id: number;
  scale_with_root: ScaleWithRoot;
}

export interface ChordScaleSequenceData {
  chord_ids: number[];
  scale_with_roots: ScaleWithRoot[];
}

export interface ChordScaleSequence {
  tick: number;
  data: ChordScaleSequenceData;
}

export interface ChordScaleConfig {
  scales: Scale[];
  chords: Chord[];
  chord_scale_relations: ChordScaleRelation[];
  sequences: ChordScaleSequence[];
  loop_length_tick: number;
}
```

## 実装手順

1. **DataTypes.ts** に `kChordScaleConfig: 15` を追加
2. **DeviceControlCommand.ts** に `kRequestChordScaleConfig: 0x16` を追加
3. **dataTransferClient.ts** に `requestChordScaleConfig()` と `sendChordScaleConfig()` メソッドを追加
4. **commandClient.ts** に `requestChordScaleConfig()` メソッドを追加
5. **types/chordScale.ts** を作成して型定義を追加

## 動作フロー

1. **送信（デバイス → webアプリ）**：
   - webアプリから `kRequestChordScaleConfig` コマンドを受信
   - ChordScaleControllerから現在の設定をJSONにエクスポート
   - DataTransferでwebアプリに送信

2. **受信（webアプリ → デバイス）**：
   - webアプリからコード進行設定JSONを受信
   - ChordScaleControllerでJSONから設定を再構築
   - NoteNumberConverterを再構築して設定変更を反映
