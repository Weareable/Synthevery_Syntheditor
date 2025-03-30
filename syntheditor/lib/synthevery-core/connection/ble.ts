/// <reference types="web-bluetooth" />

// eventemitter3
import EventEmitter from 'eventemitter3';
import { BLE_SERVICE_UUID, MAC_ADDRESS_CHAR_UUID, MESH_SERVICE_UUID, CONNECTION_INFO_SERVICE_UUID } from './constants';
import { getAddressString } from './util';

const CONNECTION_STATUS_CHECK_INTERVAL = 100;

export const SyntheveryDeviceFilter = {
    filters: [{ services: [MESH_SERVICE_UUID] }],
    optionalServices: [MESH_SERVICE_UUID, CONNECTION_INFO_SERVICE_UUID],
};

interface BLEDeviceEvents {
    connected: {};
    disconnected: {};
}
export class BLEDevice {
    device: BluetoothDevice | null = null;
    server: BluetoothRemoteGATTServer | null = null;
    eventEmitter = new EventEmitter<BLEDeviceEvents>();

    available(): boolean {
        return this.server !== null && this.server.connected;
    }

    async connect(options: RequestDeviceOptions): Promise<void> {
        try {
            const device = await navigator.bluetooth.requestDevice(options);
            const server = await device.gatt?.connect();
            if (!server || !server.connected) {
                throw new Error('Failed to connect GATT server');
            }
            this.device = device;
            this.server = server;

            this.device.addEventListener('gattserverdisconnected', () => {
                console.log('gattserverdisconnected');
                this.eventEmitter.emit('disconnected');
            });

            this.eventEmitter.emit('connected');

        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.server?.connected) {
            this.server.disconnect();
        }
        this.device = null;
        this.server = null;
    }

    async getCharacteristic(serviceUuid: string, characteristicUuid: string): Promise<BluetoothRemoteGATTCharacteristic | null> {
        if (!this.server?.connected) {
            throw new Error('Device is not connected');
        }
        const service = await this.server.getPrimaryService(serviceUuid);
        if (!service) {
            throw new Error(`Service ${serviceUuid} not found`);
        }
        const characteristic = await service.getCharacteristic(characteristicUuid);
        if (!characteristic) {
            throw new Error(`Characteristic ${characteristicUuid} not found`);
        }
        return characteristic;
    }

    async readCharacteristicOnce(serviceUuid: string, characteristicUuid: string): Promise<DataView> {
        if (!this.server?.connected) {
            throw new Error('Device is not connected');
        }
        const service = await this.server.getPrimaryService(serviceUuid);
        if (!service) {
            throw new Error(`Service ${serviceUuid} not found`);
        }
        const characteristic = await service.getCharacteristic(characteristicUuid);
        if (!characteristic) {
            throw new Error(`Characteristic ${characteristicUuid} not found`);
        }
        const value = await characteristic.readValue();
        return value;
    }

    async writeCharacteristicOnce(serviceUuid: string, characteristicUuid: string, data: BufferSource): Promise<void> {
        if (!this.server?.connected) {
            throw new Error('Device is not connected');
        }
        const service = await this.server.getPrimaryService(serviceUuid);
        if (!service) {
            throw new Error(`Service ${serviceUuid} not found`);
        }
        const characteristic = await service.getCharacteristic(characteristicUuid);
        if (!characteristic) {
            throw new Error(`Characteristic ${characteristicUuid} not found`);
        }
        await characteristic.writeValue(data);
    }

    async writeCharacteristic(characteristic: BluetoothRemoteGATTCharacteristic, data: BufferSource): Promise<void> {
        if (!this.server?.connected) {
            throw new Error('Device is not connected');
        }
        await characteristic.writeValue(data);
    }

    async startNotify(serviceUuid: string, characteristicUuid: string, onChange: (value: DataView) => void): Promise<void> {
        if (!this.server?.connected) {
            throw new Error('Device is not connected');
        }
        const service = await this.server.getPrimaryService(serviceUuid);
        if (!service) {
            throw new Error(`Service ${serviceUuid} not found`);
        }
        const characteristic = await service.getCharacteristic(characteristicUuid);
        if (!characteristic) {
            throw new Error(`Characteristic ${characteristicUuid} not found`);
        }
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
            const target = event.target as BluetoothRemoteGATTCharacteristic;
            if (target?.value === undefined) {
                return;
            }
            onChange(target.value);
        });
        await characteristic.startNotifications();
    }

    async stopNotify(serviceUuid: string, characteristicUuid: string): Promise<void> {
        if (!this.server?.connected) {
            throw new Error('Device is not connected');
        }
        const service = await this.server.getPrimaryService(serviceUuid);
        if (!service) {
            throw new Error(`Service ${serviceUuid} not found`);
        }
        const characteristic = await service.getCharacteristic(characteristicUuid);
        if (!characteristic) {
            throw new Error(`Characteristic ${characteristicUuid} not found`);
        }
        await characteristic.stopNotifications();
    }
}
