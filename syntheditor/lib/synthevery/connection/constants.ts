export const MESH_SERVICE_UUID = "0f287fc3-97db-a249-e3ce-9461eb65dc52";
export const CONNECTION_INFO_SERVICE_UUID = "3b145d6b-721d-f02b-4718-61a32f860fa5";
export const MAC_ADDRESS_CHAR_UUID = "e8771894-9411-6d2e-ae0c-cb2eb5cb1c40";
export const CONNECTED_DEVICES_CHAR_UUID = "befea93d-5f47-9a86-b6e1-720f19430641";
export const MESH_PACKET_TX_CHAR_UUID = "eeb4f625-d307-efb1-779e-6d913d961982";
export const MESH_PACKET_RX_CHAR_UUID = "eba308dc-e069-d268-a43f-2e341418fae9";
export const APP_MAC_ADDRESS = new Uint8Array([0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);

export const MESH_PACKET_TYPE_NEIGHBOR_LIST = 0xFF;
export const MESH_PACKET_TYPE_DEVICE_TYPE = 0xFE;
export const MESH_PACKET_TYPE_RELATIVE_LEADER = 0xFD;
export const MESH_PACKET_TYPE_APP_STATE = 0xFC;
export const MESH_PACKET_TYPE_TIME_SYNC = 0xFB;
export const MESH_PACKET_TYPE_TICK_CLOCK_SYNC = 0xFA;
export const MESH_PACKET_TYPE_COMMAND = 0xF9;
export const MESH_PACKET_TYPE_SENSOR_DATA = 0xF8;
export const MESH_PACKET_TYPE_MOTION_DATA = 0xF7;
export const MESH_PACKET_TYPE_PEER_DISTANCE = 0xF6;

export const DEVICE_TYPE_SYNTHEVERY = 0x00;
export const DEVICE_TYPE_APP = 0x01;

export const SyntheveryDeviceFilter = {
    filters: [{ services: [MESH_SERVICE_UUID] }],
    optionalServices: [MESH_SERVICE_UUID, CONNECTION_INFO_SERVICE_UUID],
};
