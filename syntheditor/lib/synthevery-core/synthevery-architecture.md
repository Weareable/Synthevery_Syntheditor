# Synthevery アプリケーションのアーキテクチャ改善計画

## 現状の課題

*   複数の Provider が入れ子になっており、パフォーマンス上の問題や、複雑さがある。
*   デバイスの通信プロトコル (Mesh, command, appstate) は、React に依存しないのに、カスタムフックですべて実装されている。

## 解決策

1.  外部ライブラリとして分離する。
2.  `synthevery-core` ライブラリを作成し、syntheveryオブジェクトをシングルトンとして保持する。
3.  `ble-library`、`mesh-library`、`command-library`、`appstate-library` を作成し、`synthevery-core` ライブラリにアクセスするための関数を提供する。
4.  React コンポーネントでは、`useState` フックを使用して状態を管理し、上記の関数を呼び出して状態を更新する。
5.  React と連携するためのカスタムフックを作成する。

## 外部ライブラリの設計

*   `synthevery-core`:
    *   `Synthevery` クラス: BLE デバイスとの接続、Mesh ネットワークの管理、コマンド通信、およびアプリケーションの状態管理を行うためのクラス。
    *   `syntheveryInstance` 定数: `Synthevery` クラスのシングルトンインスタンスを `const` で定義する。
*   `ble-library`:
    *   `connect(options: RequestDeviceOptions): Promise<void>`: BLE デバイスに接続する。
    *   `disconnect(): Promise<void>`: BLE デバイスから切断する。
    *   `readCharacteristic(serviceUuid: string, characteristicUuid: string): Promise<DataView>`: BLE キャラクタリスティックを読み取る。
    *   `writeCharacteristic(serviceUuid: string, characteristicUuid: string, data: BufferSource): Promise<void>`: BLE キャラクタリスティックに書き込む。
    *   `startNotify(serviceUuid: string, characteristicUuid: string, onChange: (value: DataView) => void): Promise<void>`: BLE 通知を開始する。
    *   `stopNotify(serviceUuid: string, characteristicUuid: string): Promise<void>`: BLE 通知を停止する。
*   `mesh-library`:
    *   `initializeMesh(): Promise<void>`: Mesh ネットワークを初期化する。
    *   `sendPacket(type: number, destination: P2PMacAddress, data: Uint8Array): Promise<void>`: Mesh パケットを送信する。
    *   `setCallback(type: number, func: (packet: MeshPacket) => void): void`: Mesh パケットのコールバックを設定する。
    *   `removeCallback(type: number): void`: Mesh パケットのコールバックを削除する。
*   `command-library`:
    *   `getCommandHandler(nodeAddress: P2PMacAddress, create: boolean): CommandHandler | undefined`: コマンドハンドラーを取得する。
    *   `getEventEmitter(nodeAddress: P2PMacAddress): EventEmitter<any> | undefined`: イベントエミッターを取得する。
    *   `isAvailable(nodeAddress: P2PMacAddress): boolean`: コマンドが利用可能かどうかを確認する。
*   `appstate-library`:
    *   `getAppState(stateId: AppStateID): any`: アプリケーションの状態を取得する。
    *   `setAppState(stateId: AppStateID, value: any): void`: アプリケーションの状態を設定する。

## 今後の計画

1.  `synthevery-core` ライブラリを実装する。
2.  `ble-library` を実装する。
3.  `mesh-library` を実装する。
4.  `command-library` を実装する。
5.  `appstate-library` を実装する。
6.  React と連携するためのカスタムフックを作成する。