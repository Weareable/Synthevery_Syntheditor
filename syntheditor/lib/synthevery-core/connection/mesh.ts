import { P2PMacAddress, MeshPacket } from '../types/mesh';
import { CONNECTION_INFO_SERVICE_UUID, MESH_SERVICE_UUID, MESH_PACKET_TX_CHAR_UUID, MESH_PACKET_RX_CHAR_UUID, MESH_PACKET_TYPE_NEIGHBOR_LIST, CONNECTED_DEVICES_CHAR_UUID, APP_MAC_ADDRESS, MAC_ADDRESS_CHAR_UUID } from './constants';
import { BLEDevice, SyntheveryDeviceFilter } from './ble';
import { decodeMeshPacket, decodeConnectedDevices, encodeNeighborListData, encodeMeshPacket } from './util';
import EventEmitter from 'eventemitter3';
import { getAddressString, equalsAddress } from './util';



export interface BLEMeshDeviceEvents {
    connectedDevicesChanged: (devices: P2PMacAddress[]) => void;
    disconnected: () => void;
}

const MAX_RETRY_COUNT = 3;

class BLEMeshDevice {
    address: P2PMacAddress | null = null;
    bleDevice: BLEDevice | null = null;
    connectedDevices: P2PMacAddress[] = [];
    eventEmitter = new EventEmitter<BLEMeshDeviceEvents>();
    packetReceiver: (packet: MeshPacket) => void = () => { };

    private meshPacketTxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
    private sendQueue: Array<MeshPacket> = [];
    private isSending: boolean = false;
    private packetIndex: Map<string, number> = new Map();

    async initialize(bleDevice: BLEDevice, packetReceiver: (packet: MeshPacket) => void): Promise<void> {
        this.bleDevice = bleDevice;

        if (!this.bleDevice) {
            console.error('BLE device is not connected');
            this.disconnect();
            return;
        }
        try {
            const peerMacAddressValue = await this.bleDevice.readCharacteristicOnce(CONNECTION_INFO_SERVICE_UUID, MAC_ADDRESS_CHAR_UUID);
            const peerMacAddress = new Uint8Array(peerMacAddressValue.buffer);
            this.address = { address: peerMacAddress };

            this.packetReceiver = packetReceiver;

            this.meshPacketTxCharacteristic = await this.bleDevice.getCharacteristic(MESH_SERVICE_UUID, MESH_PACKET_TX_CHAR_UUID);

            await this.bleDevice.startNotify(MESH_SERVICE_UUID, MESH_PACKET_RX_CHAR_UUID, this.handleMeshPacketReceived.bind(this));
            await this.bleDevice.startNotify(CONNECTION_INFO_SERVICE_UUID, CONNECTED_DEVICES_CHAR_UUID, this.handleConnectedDevicesChanged.bind(this));

            const connectedDevicesValue = await this.bleDevice.readCharacteristicOnce(CONNECTION_INFO_SERVICE_UUID, CONNECTED_DEVICES_CHAR_UUID);
            const connectedDevices = new Uint8Array(connectedDevicesValue.buffer);
            this.connectedDevices = decodeConnectedDevices(connectedDevices);

            this.bleDevice.eventEmitter.on('disconnected', () => {
                this.cleanup();
                this.eventEmitter.emit('disconnected');
            });
        } catch (error) {
            console.error('Error initializing Mesh:', error);
            this.disconnect();
        }
    }

    async disconnect(): Promise<void> {
        await this.bleDevice?.disconnect();
        this.cleanup();
        this.eventEmitter.emit('disconnected');
    }

    private cleanup(): void {

        this.bleDevice?.stopNotify(MESH_SERVICE_UUID, MESH_PACKET_RX_CHAR_UUID).catch((error) => {
            console.error('Error stopping notify:', error);
        });
        this.bleDevice?.stopNotify(CONNECTION_INFO_SERVICE_UUID, CONNECTED_DEVICES_CHAR_UUID).catch((error) => {
            console.error('Error stopping notify:', error);
        });

        this.bleDevice = null;
        this.connectedDevices = [];
        this.packetReceiver = () => { };
        this.eventEmitter.emit('connectedDevicesChanged', []);
    }

    private handleMeshPacketReceived(value: DataView): void {
        const packet = decodeMeshPacket(new Uint8Array(value.buffer));
        this.packetReceiver(packet);
    }

    private handleConnectedDevicesChanged(value: DataView): void {
        const connectedDevices = decodeConnectedDevices(new Uint8Array(value.buffer));
        this.connectedDevices = connectedDevices;
        this.eventEmitter.emit('connectedDevicesChanged', connectedDevices);
    }

    getAddress(): P2PMacAddress {
        if (!this.address) {
            throw new Error('BLE device is not connected');
        }
        return this.address;
    }

    getConnectedDevices(): P2PMacAddress[] {
        if (!this.bleDevice) {
            console.error('BLE device is not connected');
            return [];
        }
        return this.connectedDevices;
    }

    sendPacket(meshPacket: MeshPacket): void {
        this.sendQueue.push(meshPacket);
        if (!this.isSending) {
            this.processQueue();
        }
    }

    async processQueue(): Promise<void> {
        if (this.isSending) {
            // すでに送信中の場合は何もしない
            return;
        }
        this.isSending = true;
        while (this.sendQueue.length > 0 && this.bleDevice) {
            const packetData = this.sendQueue.shift();
            let retryCount = 0;

            while (packetData && retryCount < MAX_RETRY_COUNT && this.bleDevice) {
                try {
                    await this.write(packetData);
                    retryCount = MAX_RETRY_COUNT; // 成功したらループ脱出
                } catch (error) {
                    retryCount++;
                    if (retryCount >= MAX_RETRY_COUNT) {
                        console.error('Max retry attempts reached for packet:', packetData);
                    }
                }
            }
        }
        this.isSending = false;
    }

    private async write(meshPacket: MeshPacket): Promise<void> {
        if (!this.bleDevice) {
            console.error('BLE device is not connected');
            return;
        }
        if (!this.meshPacketTxCharacteristic) {
            console.error('Mesh packet tx characteristic is not available');
            return;
        }

        const currentIndex = this.packetIndex.get(getAddressString(meshPacket.destination)) || 0;
        meshPacket.index = currentIndex;
        this.packetIndex.set(getAddressString(meshPacket.destination), currentIndex + 1);

        const meshPacketCopy = { ...meshPacket };
        meshPacketCopy.index = currentIndex;

        const data = encodeMeshPacket(meshPacketCopy);

        const now = new Date();
        await this.bleDevice.writeCharacteristic(this.meshPacketTxCharacteristic, data);
        console.log("SENT", new Date().getTime() - now.getTime(), meshPacket.type, meshPacket.data);
    }
}

export interface MeshEvents {
    connectedDevicesChanged: (devices: P2PMacAddress[]) => void;
    connected: (address: P2PMacAddress) => void;
    disconnected: (address: P2PMacAddress) => void;
    peerConnected: (address: P2PMacAddress) => void;
    peerDisconnected: (address: P2PMacAddress) => void;
}

class Mesh {
    meshDevices: Map<string, BLEMeshDevice> = new Map();
    private prevConnectedDevices: P2PMacAddress[] = [];

    private meshPacketCallbacks: Map<number, (packet: MeshPacket) => void> = new Map();

    private neighborListIntervalId: NodeJS.Timeout | null = null;
    eventEmitter = new EventEmitter<MeshEvents>();

    constructor() {
        this.neighborListIntervalId = setInterval(() => {
            try {
                this.sendNeighborList();
            } catch (error) { }
        }, 1000);
        this.prevConnectedDevices = [];
    }

    private recalculateConnectedDevices(): void {
        const currentDevices = this.getConnectedDevices();

        const newDevices = currentDevices.filter(current =>
            !this.prevConnectedDevices.some(prev =>
                equalsAddress(prev, current)
            )
        );

        const disconnectedDevices = this.prevConnectedDevices.filter(prev =>
            !currentDevices.some(current =>
                equalsAddress(current, prev)
            )
        );

        this.prevConnectedDevices = currentDevices;

        newDevices.forEach(device => {
            this.eventEmitter.emit('connected', device);
        });

        disconnectedDevices.forEach(device => {
            this.eventEmitter.emit('disconnected', device);
        });

        if (newDevices.length > 0 || disconnectedDevices.length > 0) {
            this.eventEmitter.emit('connectedDevicesChanged', currentDevices);
        }
    }

    async connectDevice(): Promise<void> {
        const device = new BLEDevice();
        const meshDevice = new BLEMeshDevice();

        meshDevice.eventEmitter.on('disconnected', () => {
            this.deleteDevice(meshDevice.getAddress());
            this.eventEmitter.emit('peerDisconnected', meshDevice.getAddress());
            this.recalculateConnectedDevices();
        });

        meshDevice.eventEmitter.on('connectedDevicesChanged', () => {
            this.recalculateConnectedDevices();
        });

        try {
            await device.connect(SyntheveryDeviceFilter);
            await meshDevice.initialize(device, this.receivePacket.bind(this));
            this.meshDevices.set(getAddressString(meshDevice.getAddress()), meshDevice);
            this.eventEmitter.emit('peerConnected', meshDevice.getAddress());
            this.recalculateConnectedDevices();
        } catch (error) {
            console.error('Error connecting to device:', error);
        }
    }

    async disconnectDevice(address: P2PMacAddress): Promise<void> {
        const meshDevice = this.meshDevices.get(getAddressString(address));
        if (!meshDevice) {
            throw new Error('Mesh device not found');
        }
        await meshDevice.disconnect();
    }

    private deleteDevice(address: P2PMacAddress): void {
        console.log('deleteDevice', address);
        this.meshDevices.delete(getAddressString(address));
        this.recalculateConnectedDevices();
    }

    private receivePacket(packet: MeshPacket): void {
        const callback = this.meshPacketCallbacks.get(packet.type);
        if (callback) {
            callback(packet);
        }
    }

    private sendNeighborList(): void {
        const neighborList = encodeNeighborListData({
            sender: { address: APP_MAC_ADDRESS },
            neighbor_addresses: Array.from(this.meshDevices.values()).map(device => device.getAddress()),
            sent_addresses: [{ address: APP_MAC_ADDRESS }],
        });
        for (const meshDevice of this.meshDevices.values()) {
            meshDevice.sendPacket({
                type: MESH_PACKET_TYPE_NEIGHBOR_LIST,
                destination: meshDevice.getAddress(),
                data: neighborList,
                index: 0,
                source: { address: APP_MAC_ADDRESS },
            });
        }
    }

    async sendPacket(type: number, destination: P2PMacAddress, data: Uint8Array): Promise<void> {
        try {
            const peerAddress = this.getNextHop(destination);
            const meshDevice = this.meshDevices.get(getAddressString(peerAddress));
            if (!meshDevice) {
                throw new Error('Mesh device not found');
            }
            meshDevice.sendPacket({
                type: type,
                destination: destination,
                data: data,
                index: 0,
                source: { address: APP_MAC_ADDRESS },
            });
        } catch (error) {
            console.error('Error sending packet:', error);
        }
    }
    private getNextHop(destination: P2PMacAddress): P2PMacAddress {
        for (const meshDevice of this.meshDevices.values()) {
            if (
                getAddressString(meshDevice.getAddress()) === getAddressString(destination) ||
                meshDevice.getConnectedDevices().some(address => getAddressString(address) === getAddressString(destination))
            ) {
                return meshDevice.getAddress();
            }
        }
        throw new Error('Peer address not found');
    }

    getConnectedPeers(): P2PMacAddress[] {
        return Array.from(this.meshDevices.values()).map(bleMeshDevice => bleMeshDevice.getAddress());
    }

    getConnectedDevices(): P2PMacAddress[] {
        // 各meshDeviceのconnectedDevicesを結合し, 重複を削除した配列を返す
        return Array.from(new Set([...Array.from(this.meshDevices.values()).flatMap(bleMeshDevice => bleMeshDevice.getConnectedDevices())]));
    }

    isAvailable(nodeAddress: P2PMacAddress): boolean {
        return this.getConnectedDevices().some(address => equalsAddress(address, nodeAddress));
    }

    setCallback(type: number, func: (packet: MeshPacket) => void): void {
        this.meshPacketCallbacks.set(type, func);
    }

    removeCallback(type: number): void {
        this.meshPacketCallbacks.delete(type);
    }

    getAddress(): P2PMacAddress {
        return { address: APP_MAC_ADDRESS };
    }
}

export const mesh = new Mesh();
