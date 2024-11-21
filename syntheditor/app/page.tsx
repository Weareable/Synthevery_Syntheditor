/// <reference types="web-bluetooth" />

"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [receivedData, setReceivedData] = useState<number[]>([]);

  const requestBluetoothDevice = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["battery_service"], // 必要に応じて変更
      });
      setDevice(device);

      const server = await device.gatt?.connect();
      if (!server) throw new Error("Failed to connect to GATT server");

      const service = await server.getPrimaryService("battery_service");
      const characteristic = await service.getCharacteristic("battery_level");
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
    setReceivedData((prevData) => [...valuesArray]);
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
      </div>
    </div>
  );
}