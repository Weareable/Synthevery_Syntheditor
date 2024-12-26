export async function connectDevice() {
    /*
    const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: false,
        filters: [
            { services: ["0f287fc3-97db-a249-e3ce-9461eb65dc52"] },
            { name: "Synthevery" }
        ]
    });
    */

    const server = await device.gatt?.connect();

    return { device, server }
}