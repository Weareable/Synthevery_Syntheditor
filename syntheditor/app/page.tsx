/// <reference types="web-bluetooth" />

"use client";

import Button from "@mui/material/Button";
import { useState } from "react";
import { Bluetooth } from "webbluetooth";

export default function Home() {
  const bluetooth = require("webbluetooth").bluetooth as Bluetooth;

  const [device, setDevice] = useState<BluetoothDevice | null>(null);

  function connectBluetooth() {
    if (!bluetooth) {
      console.log("Bluetooth not available, please use a browser that supports it.");
      return;
    }
    bluetooth.requestDevice({
      acceptAllDevices: true,
    }).then((device: BluetoothDevice) => {
      setDevice(device);
    });
  }

  return (
    <div>
      <h1>Syntheditor</h1>
      <Button variant="contained" onClick={connectBluetooth}>Hello World</Button>
      {device && <p>{device.name}</p>}
      {device && <p>{device.id}</p>}
    </div>
  );
}
