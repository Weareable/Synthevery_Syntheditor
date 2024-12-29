export const MESH_SERVICE_UUID = "0f287fc3-97db-a249-e3ce-9461eb65dc52";
export const CONNECTION_INFO_SERVICE_UUID = "3b145d6b-721d-f02b-4718-61a32f860fa5";
export const MAC_ADDRESS_CHAR_UUID = "e8771894-9411-6d2e-ae0c-cb2eb5cb1c40";
export const MESH_PACKET_TX_CHAR_UUID = "eeb4f625-d307-efb1-779e-6d913d961982";
export const MESH_PACKET_RX_CHAR_UUID = "eba308dc-e069-d268-a43f-2e341418fae9";
export const APP_MAC_ADDRESS = new Uint8Array([0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);

export const SyntheveryDeviceFilter = {
    filters: [{ services: [MESH_SERVICE_UUID] }],
    optionalServices: [MESH_SERVICE_UUID, CONNECTION_INFO_SERVICE_UUID],
};

