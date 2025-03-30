// role-synchronizer.tsx
'use client';

import {
    P2PMacAddress,
} from '@/types/mesh';
import { RoleRegistry } from './node-role';


export const sendRoleRequest = async (
    sendPacket: (
        type: number,
        destination: P2PMacAddress,
        data: Uint8Array
    ) => Promise<void>,
    registry: RoleRegistry,
    address: P2PMacAddress,
) => {
    await sendPacket(registry.packetType, address, new Uint8Array());
};

export const notifyRoleChange = async (
    sendPacket: (
        type: number,
        destination: P2PMacAddress,
        data: Uint8Array
    ) => Promise<void>,
    getAddress: () => P2PMacAddress,
    registry: RoleRegistry
) => {
    const myAddress = getAddress();
    const roles = registry.getRoles(myAddress);
    const roleArray = Array.from(roles);
    const data = new Uint8Array(roleArray);
    const nodes = registry.getNodes();
    for (const node of nodes) {
        await sendPacket(registry.packetType, node, data);
    }
};

export const refreshRegistry = async (
    sendPacket: (
        type: number,
        destination: P2PMacAddress,
        data: Uint8Array
    ) => Promise<void>,
    registry: RoleRegistry,
    getAddress: () => P2PMacAddress,
    only_refresh_unknown: boolean
) => {
    let nodes: P2PMacAddress[] = [];
    if (only_refresh_unknown) {
        nodes = registry.filterNodes(
            (address: P2PMacAddress, roles: Set<number>) => roles.size === 0
        );
    } else {
        nodes = registry.getNodes();
    }
    for (const node of nodes) {
        await sendRoleRequest(sendPacket, registry, node);
    }
};