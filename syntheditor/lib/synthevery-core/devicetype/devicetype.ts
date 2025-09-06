'use client';

import { P2PMacAddress } from '../types/mesh';
import { createRoleRegistry, RoleRegistry } from './node-role';
import { MESH_PACKET_TYPE_DEVICE_TYPE } from '../connection/constants';
import { APP_MAC_ADDRESS } from '../connection/constants';
import { DEVICE_TYPE_APP } from './constants';
import { Mesh } from '../connection/mesh';
import { MeshPacket } from '../types/mesh';
import { handleRolePacket } from './role-packet-handler';
import { refreshRegistry } from './node-role-synchronizer';

export class DeviceTypeSynchronizer {
    private mesh: Mesh;
    private registry: RoleRegistry;
    private intervalId: NodeJS.Timeout | null = null;

    constructor(mesh: Mesh) {
        this.mesh = mesh;
        this.registry = createRoleRegistry(MESH_PACKET_TYPE_DEVICE_TYPE);
        this.registry.registerRole({ address: APP_MAC_ADDRESS }, DEVICE_TYPE_APP);

        this.mesh.setCallback(MESH_PACKET_TYPE_DEVICE_TYPE, this.handlePacket.bind(this));

        this.intervalId = setInterval(() => {
            this.registry.updateNodeRoles(this.mesh.getConnectedDevices());
            refreshRegistry(
                (type: number, destination: P2PMacAddress, data: Uint8Array) => this.mesh.sendPacket(type, destination, data),
                this.registry,
                this.mesh.getAddress,
                true
            );
        }, 1000);
    }

    getRegistry() {
        return this.registry;
    }

    getDeviceType(address: P2PMacAddress) {
        return this.registry.getRoles(address).has(DEVICE_TYPE_APP);
    }

    private handlePacket(packet: MeshPacket) {
        handleRolePacket(
            (type: number, destination: P2PMacAddress, data: Uint8Array) => this.mesh.sendPacket(type, destination, data),
            this.mesh.getAddress,
            this.registry,
            packet,
            (updatedRegistry: RoleRegistry) => {
                this.registry = updatedRegistry;
            }
        );
    }

}

// シングルトンインスタンスの即座生成を停止
// export const deviceTypeSynchronizer = new DeviceTypeSynchronizer();
