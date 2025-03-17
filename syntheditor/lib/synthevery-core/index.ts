import * as Ble from './ble';
import * as Mesh from './mesh';
import * as Command from './command';
import { P2PMacAddress, MeshPacket } from './types/mesh';
import EventEmitter from 'eventemitter3';
import { getCommandHandler, getEventEmitter, isAvailable, CommandHandler } from './command/index';
import { AppStateID } from './appstate';

class Synthevery {
    bleDevice: BluetoothDevice | null = null;
    bleServer: BluetoothRemoteGATTServer | null = null;
    peerMacAddress: P2PMacAddress | null = null;
    meshPacketCallbacks: Map<number, (packet: MeshPacket) => void> = new Map();
    appState: Map<AppStateID, any> = new Map();



    async readCharacteristic(serviceUuid: string, characteristicUuid: string): Promise<DataView> {
        return Ble.readCharacteristic(serviceUuid, characteristicUuid);
    }

    async writeCharacteristic(serviceUuid: string, characteristicUuid: string, data: BufferSource): Promise<void> {
        return Ble.writeCharacteristic(serviceUuid, characteristicUuid, data);
    }

    async startNotify(serviceUuid: string, characteristicUuid: string, onChange: (value: DataView) => void): Promise<void> {
        return Ble.startNotify(serviceUuid, characteristicUuid, onChange);
    }

    async stopNotify(serviceUuid: string, characteristicUuid: string): Promise<void> {
        return Ble.stopNotify(serviceUuid, characteristicUuid);
    }

    async initializeMesh(): Promise<void> {
        return Mesh.initializeMesh();
    }

    async sendPacket(type: number, destination: P2PMacAddress, data: Uint8Array): Promise<void> {
        return Mesh.sendPacket(type, destination, data);
    }

    setCallback(type: number, func: (packet: MeshPacket) => void): void {
        return Mesh.setCallback(type, func);
    }

    removeCallback(type: number): void {
        return Mesh.removeCallback(type);
    }

    getCommandHandler(nodeAddress: P2PMacAddress, create: boolean): CommandHandler | undefined {
        return getCommandHandler(nodeAddress, create);
    }

    getEventEmitter(nodeAddress: P2PMacAddress): EventEmitter<any> | undefined {
        return getEventEmitter(nodeAddress);
    }

    isAvailable(nodeAddress: P2PMacAddress): boolean {
        return isAvailable(nodeAddress);
    }

    getAppState(stateId: AppStateID): any {
        return this.appState.get(stateId);
    }

    setAppState(stateId: AppStateID, value: any): void {
        this.appState.set(stateId, value);
    }

    // TODO: アプリケーションの状態管理を行うための機能を実装する
}

const syntheveryInstance = new Synthevery();

export function getSyntheveryInstance() {
    return syntheveryInstance;
}

export { };