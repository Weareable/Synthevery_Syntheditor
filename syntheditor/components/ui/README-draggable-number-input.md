# DraggableNumberInput コンポーネント

ドラッグ可能な数値入力コンポーネントです。マウスやタッチでドラッグ操作、ボタン長押し、ボタンクリックによる数値調整が可能です。

## 機能

- **ドラッグ操作**: マウスやタッチでドラッグして数値を調整
- **ボタン操作**: 左右の矢印ボタンで数値をステップ調整
- **長押し**: ボタンを長押しして連続調整
- **ポップアップ表示**: 操作中に大きな数値を表示
- **タッチ対応**: モバイルデバイスでのタッチ操作に対応
- **カスタマイズ可能**: ラベル、単位、ステップ、感度などを設定可能

## 基本的な使用方法

```tsx
import { DraggableNumberInput } from "./draggable-number-input";

const [value, setValue] = useState(50);

<DraggableNumberInput
    min={0}
    max={100}
    value={value}
    onValueChange={setValue}
    label="VOL"
    unit="%"
/>
```

## Props

### 必須プロパティ

- `onValueChange`: 数値が変更された時のコールバック関数

### オプションプロパティ

| プロパティ        | 型                  | デフォルト  | 説明                                       |
| ----------------- | ------------------- | ----------- | ------------------------------------------ |
| `min`             | `number`            | `0`         | 最小値                                     |
| `max`             | `number`            | `999`       | 最大値                                     |
| `value`           | `number`            | `0`         | 現在の値                                   |
| `label`           | `string`            | -           | ラベルテキスト                             |
| `unit`            | `string`            | -           | 単位テキスト                               |
| `step`            | `number`            | `1`         | ボタンクリック時のステップ値               |
| `dragSensitivity` | `number`            | `0.2`       | ドラッグ感度（数値が大きいほど感度が高い） |
| `showPopup`       | `boolean`           | `true`      | ポップアップ表示の有無                     |
| `popupLabel`      | `string`            | -           | ポップアップ内のラベル                     |
| `color`           | `"default"`         | `"default"` | カラーテーマ                               |
| `rounded`         | `"md" \| "full"`    | `"md"`      | 角丸の種類                                 |
| `size`            | `"default" \| "sm"` | `"default"` | サイズ                                     |
| `className`       | `string`            | -           | 追加のCSSクラス                            |

## 使用例

### 音量コントロール

```tsx
<DraggableNumberInput
    min={0}
    max={100}
    value={volume}
    onValueChange={setVolume}
    label="VOL"
    unit="%"
    step={1}
    dragSensitivity={0.5}
/>
```

### テンポコントロール

```tsx
<DraggableNumberInput
    min={60}
    max={200}
    value={tempo}
    onValueChange={setTempo}
    label="BPM"
    step={1}
    dragSensitivity={0.2}
    showPopup={true}
    popupLabel="BPM"
/>
```

### パンコントロール

```tsx
<DraggableNumberInput
    min={-100}
    max={100}
    value={pan}
    onValueChange={setPan}
    label="PAN"
    unit="%"
    step={5}
    dragSensitivity={0.3}
/>
```

### 高精度コントロール

```tsx
<DraggableNumberInput
    min={0}
    max={1}
    value={reverb}
    onValueChange={setReverb}
    label="REV"
    step={0.1}
    dragSensitivity={0.01}
/>
```

## カスタマイズ

### スタイルのカスタマイズ

```tsx
<DraggableNumberInput
    // ... その他のプロパティ
    className="bg-blue-50 border-blue-200 text-blue-900"
    size="sm"
    rounded="full"
/>
```

### ポップアップの無効化

```tsx
<DraggableNumberInput
    // ... その他のプロパティ
    showPopup={false}
/>
```

## アクセシビリティ

- 左右のボタンには適切なaria-labelが設定されています
- キーボードナビゲーションに対応
- スクリーンリーダーでの読み上げに対応

## パフォーマンス

- ドラッグ操作中は適切なイベントリスナーの管理
- タッチ操作後のゴーストマウスイベント防止
- メモリリークを防ぐための適切なクリーンアップ

## 注意事項

- ドラッグ操作中はボタン長押しは無効になります
- タッチ操作後は短時間マウスイベントを無視します
- 値は常にmin-maxの範囲内に制限されます
