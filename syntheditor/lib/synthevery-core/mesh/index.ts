import { getSyntheveryInstance } from '../index';
import { P2PMacAddress, MeshPacket } from '../types/mesh';
import { CONNECTION_INFO_SERVICE_UUID, MAC_ADDRESS_CHAR_UUID, MESH_SERVICE_UUID, MESH_PACKET_TX_CHAR_UUID } from './constants';
import { BLEDevice } from '../ble';

export class Mesh {
    bleDevice: BLEDevice;

    meshPacketTxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
    meshPacketRxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
    peerMacCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

    peerMacAddress: P2PMacAddress | null = null;
    meshPacketCallbacks: Map<number, (packet: MeshPacket) => void> = new Map();

    constructor(bleDevice: BLEDevice) {
        this.bleDevice = bleDevice;
    }

    async initializeMesh(): Promise<void> {
        if (!this.bleDevice.available()) {
            throw new Error('BLE device is not connected');
        }

        // BLE デバイスから Mesh 関連の情報を取得する
        try {
            this.peerMacCharacteristic = await this.bleDevice.getCharacteristic(CONNECTION_INFO_SERVICE_UUID, MAC_ADDRESS_CHAR_UUID);
            if (!this.peerMacCharacteristic) {
                throw new Error('Peer mac characteristic not found');
            }
            const peerMacValue = await this.peerMacCharacteristic.readValue();
            const peerMacAddress = new Uint8Array(peerMacValue.buffer);
            this.peerMacAddress = { address: peerMacAddress };
        } catch (error) {
            console.error('Error initializing Mesh:', error);
            throw error;
        }
    }

    async sendPacket(type: number, destination: P2PMacAddress, data: Uint8Array): Promise<void> {
        if (!this.bleDevice.available()) {
            throw new Error('BLE device is not connected');
        }
        await this.bleDevice.writeCharacteristicOnce(MESH_SERVICE_UUID, MESH_PACKET_TX_CHAR_UUID, data);
    }

    setCallback(type: number, func: (packet: MeshPacket) => void): void {
        this.meshPacketCallbacks.set(type, func);
    }

    removeCallback(type: number): void {
        this.meshPacketCallbacks.delete(type);
    }
}
