/// <reference types="web-bluetooth" />

"use client";

import { useState } from "react";

export default function Home() {
  const [device, setDevice] = useState(null);
  const [characteristic, setCharacteristic] = useState(null);
  const [receivedValue, setReceivedValue] = useState("");

  const requestBluetoothDevice = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["0f287fc3-97db-a249-e3ce-9461eb65dc52"], // サービスUUIDを指定
      });
      setDevice(device);

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService("0f287fc3-97db-a249-e3ce-9461eb65dc52");
      const characteristic = await service.getCharacteristic("eba308dc-e069-d268-a43f-2e341418fae9");
      setCharacteristic(characteristic);

      const value = await characteristic.readValue();
      setReceivedValue(value.getUint8(0)); // 例：バッテリーレベル
    } catch (error) {
      console.error("Bluetooth Error:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Web Bluetooth Demo</h1>
      <button onClick={requestBluetoothDevice}>
        {device ? "Reconnect" : "Connect Bluetooth Device"}
      </button>
      {device && <p>Connected to: {device.name || "Unnamed Device"}</p>}
      {receivedValue !== "" && <p>Received Value: {receivedValue}</p>}
    </div>
  );
}