/// <reference types="web-bluetooth" />

"use client";

import { useState, useEffect } from "react";
import { decode } from "@msgpack/msgpack";

import * as MeshNode from "@/lib/synthevery/connection/mesh-node";

export default function Home() {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [receivedData, setReceivedData] = useState<number[]>([]);
  const [receivedObject, setReceivedObject] = useState<any>({});

  const requestBluetoothDevice = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["0f287fc3-97db-a249-e3ce-9461eb65dc52"], // 必要に応じて変更
      });
      setDevice(device);

      const server = await device.gatt?.connect();
      if (!server) throw new Error("Failed to connect to GATT server");

      const service = await server.getPrimaryService("0f287fc3-97db-a249-e3ce-9461eb65dc52");
      const characteristic = await service.getCharacteristic("eba308dc-e069-d268-a43f-2e341418fae9");
      setCharacteristic(characteristic);

      await characteristic.startNotifications();
      characteristic.addEventListener(
        "characteristicvaluechanged",
        handleCharacteristicValueChanged
      );

      console.log("Notifications started");
    } catch (error) {
      console.error("Bluetooth Error:", error);
    }
  };

  const handleCharacteristicValueChanged = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    const valuesArray = Array.from(new Uint8Array(value.buffer));

    // データをデコードしてオブジェクトとしてセット
    const decodedObject = decode(value.buffer);

    if (decodedObject instanceof Array &&
      decodedObject[0] === 0xFF) {
      const srcAddress = Array.from(new Uint8Array(decodedObject[1][0]));
      setReceivedData((prevData) => valuesArray);
      setReceivedObject(decodedObject);
    }
  };

  useEffect(() => {
    return () => {
      // クリーンアップ処理: イベントリスナーと通知を解除
      if (characteristic) {
        characteristic.stopNotifications();
        characteristic.removeEventListener(
          "characteristicvaluechanged",
          handleCharacteristicValueChanged
        );
      }
    };
  }, [characteristic]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Web Bluetooth: Subscribe and Display Data</h1>
      <button onClick={requestBluetoothDevice}>
        {device ? "Reconnect" : "Connect Bluetooth Device"}
      </button>
      {device && <p>Connected to: {device.name || "Unnamed Device"}</p>}
      <div>
        <h2>Received Data:</h2>
        <pre>{JSON.stringify(receivedData, null, 2)}</pre>
        <pre>{JSON.stringify(receivedObject[1], null, 2)}</pre>
      </div>

      <div>
        {Array.from(MeshNode.encodeNeighborListData({
          sender: { address: new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]) },
          neighbor_addresses: [
            { address: new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]) },
          ],
          sent_addresses: [
            { address: new Uint8Array([0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]) },
          ],
        })).map(byte => byte.toString(16).padStart(2, '0')).join(' ')}
      </div>

      <div>
        {Array.from(MeshNode.encodeMeshPacket({
          type: 0xFF,
          source: { address: new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]) },
          destination: { address: new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]) },
          data: new Uint8Array([0xAA, 0xBB, 0xCC]),
          index: 1
        })).map(byte => byte.toString(16).padStart(2, '0')).join(' ')}
      </div>
    </div>
  );
}