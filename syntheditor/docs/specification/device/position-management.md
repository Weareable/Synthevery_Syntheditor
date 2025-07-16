# Position管理仕様

## 1. 概要
Syntheveryデバイスは「手持ち」「左腕」「右腕」「左足」「右足」などのPosition（装着位置）を持ちます。本ドキュメントでは、Positionの種類・状態管理・演奏モード切替について記述します。

## 2. Positionの種類
- 手持ち
- 左腕
- 右腕
- 左足
- 右足
- その他（将来的な拡張用）

## 3. Position状態管理（DevicePositionsState）
- 各デバイスのPosition情報をDevicePositionsStateで管理
- 例: TypeScriptインターフェース
```typescript
// 実装に合わせたDevicePositionsState
// Map型で管理し、Positionはnumber型（enum等で管理）
type DevicePositionsState = Map<string, number>; // deviceIdごとのPosition
```

## 4. Positionによる演奏モード切替
- デバイスは自身と他デバイスのPosition情報をもとに、演奏モードやモーション検知方法を自律的に切り替える
  - 例: 手持ちの場合は単純なモーション検知、両腕が揃っている場合は連携モード
- 切替ロジックはデバイス側で実装

## 5. アプリとデバイスの役割分担
- アプリ上ではPositionの設定のみ可能
- モード切替やモーション検知の詳細はデバイス側で自律的に制御

## 6. 運用例・ユースケース
- 例1: 左腕にSynthevery-1、右腕にSynthevery-2、両足にSynthevery-3,4を装着し、異なるトラックを担当
- 例2: 全デバイスを手持ちで使用し、全員が同じトラックを演奏 