// role-packet-handler.tsx
'use client';

import {
    P2PMacAddress,
    MeshPacket,
} from '@/types/mesh';
import { RoleRegistry } from './node-role';


export const handleRolePacket = async (
    sendPacket: (
        type: number,
        destination: P2PMacAddress,
        data: Uint8Array
    ) => Promise<void>,
    getAddress: () => P2PMacAddress,
    registry: RoleRegistry,
    packet: MeshPacket,
    registryUpdater: (receivedRegistry: RoleRegistry) => void
) => {
    if (packet.data.length === 0) {
        // Request
        const myAddress = getAddress();
        const roles = registry.getRoles(myAddress);
        const roleArray = Array.from(roles);
        const data = new Uint8Array(roleArray);
        console.log('send role packet to:');
        console.log(packet.source);
        console.log(data);
        await sendPacket(registry.packetType, packet.source, data);
    } else {
        // Update
        const roles = new Set(Array.from(packet.data));
        registryUpdater(registry.updateRoles(packet.source, roles));
    }
};