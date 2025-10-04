// デバイスのMACアドレスに対応する色設定（Webアプリ側の定数）
// キーはMACアドレスの文字列表現（例: "AA:BB:CC:DD:EE:FF"）
// 必要に応じて追記してください
export const DEVICE_COLOR_CONFIG: Record<string, { bodyColor?: string; ledColor?: string }> = {
    "8c:bf:ea:8e:57:69": { bodyColor: "tan", ledColor: "white" },
    "8c:bf:ea:8e:58:fd": { bodyColor: "orange", ledColor: "white" },
    "98:3d:ae:60:47:91": { bodyColor: "pink", ledColor: "white" },
    "d8:3b:da:74:28:a1": { bodyColor: "red", ledColor: "white" },
    "d8:3b:da:74:70:19": { bodyColor: "purple", ledColor: "white" },
    "d8:3b:da:74:72:45": { bodyColor: "green", ledColor: "white" },
};


