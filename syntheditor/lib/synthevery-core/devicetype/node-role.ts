// role-registry.tsx
'use client';

import {
    P2PMacAddress,
} from '@/types/mesh';

import { getAddressString, getAddressFromString } from '@/lib/synthevery-core/connection/util';


export interface RoleRegistry {
    readonly packetType: number;
    readonly nodeRoles: Map<string, Set<number>>;
    registerRole: (address: string | P2PMacAddress, role: number) => RoleRegistry;
    unregisterRole: (address: string | P2PMacAddress, role: number) => RoleRegistry;
    updateRoles: (address: string | P2PMacAddress, roles: Set<number>) => RoleRegistry;
    hasRole: (address: string | P2PMacAddress, role: number) => boolean;
    filterNodesByRole: (role: number) => P2PMacAddress[];
    filterNodes: (predicate: (address: P2PMacAddress, roles: Set<number>) => boolean) => P2PMacAddress[];
    addNode: (address: string | P2PMacAddress) => RoleRegistry;
    removeNode: (address: string | P2PMacAddress) => RoleRegistry;
    updateNodeRoles: (newNodes: P2PMacAddress[]) => RoleRegistry;
    getNodes: () => P2PMacAddress[];
    getRoles: (address: string | P2PMacAddress) => Set<number>;
    hasNode: (address: string | P2PMacAddress) => boolean;
}

export function createRoleRegistry(packetType: number): RoleRegistry {
    const nodeRoles = new Map<string, Set<number>>();

    const createNewRegistry = (newNodeRoles: Map<string, Set<number>>) => {
        return {
            packetType: packetType,
            nodeRoles: newNodeRoles,
            registerRole: (address: string | P2PMacAddress, role: number) => {
                const addressString = getAddressString(address);
                const updatedRoles = new Map(newNodeRoles);
                if (updatedRoles.has(addressString)) {
                    const roles = updatedRoles.get(addressString)!;
                    roles.add(role);
                } else {
                    const newRoles = new Set<number>([role]);
                    updatedRoles.set(addressString, newRoles);
                }
                return createNewRegistry(updatedRoles);
            },
            unregisterRole: (address: string | P2PMacAddress, role: number) => {
                const addressString = getAddressString(address);
                const updatedRoles = new Map(newNodeRoles);
                if (updatedRoles.has(addressString)) {
                    const roles = updatedRoles.get(addressString)!;
                    roles.delete(role);
                }
                return createNewRegistry(updatedRoles);
            },
            updateRoles: (address: string | P2PMacAddress, roles: Set<number>) => {
                const addressString = getAddressString(address);
                const updatedRoles = new Map(newNodeRoles);
                if (updatedRoles.has(addressString)) {
                    updatedRoles.set(addressString, roles);
                }
                return createNewRegistry(updatedRoles)
            },
            hasRole: (address: string | P2PMacAddress, role: number): boolean => {
                const addressString = getAddressString(address);
                return newNodeRoles.get(addressString)?.has(role) || false;
            },
            filterNodesByRole: (role: number): P2PMacAddress[] => {
                const filteredNodes: P2PMacAddress[] = [];
                newNodeRoles.forEach((roles, addressString) => {
                    if (roles.has(role)) {
                        filteredNodes.push(getAddressFromString(addressString));
                    }
                });
                return filteredNodes;
            },
            filterNodes: (predicate: (address: P2PMacAddress, roles: Set<number>) => boolean): P2PMacAddress[] => {
                const filteredNodes: P2PMacAddress[] = [];
                newNodeRoles.forEach((roles, addressString) => {
                    const address = getAddressFromString(addressString);
                    if (predicate(address, roles)) {
                        filteredNodes.push(address);
                    }
                });
                return filteredNodes;
            },
            addNode: (address: string | P2PMacAddress) => {
                const addressString = getAddressString(address);
                const updatedRoles = new Map(newNodeRoles);
                if (!updatedRoles.has(addressString)) {
                    updatedRoles.set(addressString, new Set());
                }
                return createNewRegistry(updatedRoles);
            },
            removeNode: (address: string | P2PMacAddress) => {
                const addressString = getAddressString(address);
                const updatedRoles = new Map(newNodeRoles);
                updatedRoles.delete(addressString);
                return createNewRegistry(updatedRoles);
            },
            updateNodeRoles: (newNodes: P2PMacAddress[]) => {
                const updatedRoles = new Map(newNodeRoles);
                const newNodesSet = new Set(newNodes.map(node => getAddressString(node)));

                // Remove nodes not in newNodes
                for (const [addressString, _] of updatedRoles) {
                    if (!newNodesSet.has(addressString)) {
                        updatedRoles.delete(addressString);
                    }
                }

                // Add new nodes
                newNodes.forEach(node => {
                    const addressString = getAddressString(node);
                    if (!updatedRoles.has(addressString)) {
                        updatedRoles.set(addressString, new Set());
                    }
                });
                return createNewRegistry(updatedRoles);
            },
            getNodes: (): P2PMacAddress[] => {
                return Array.from(newNodeRoles.keys()).map(addressString => getAddressFromString(addressString));
            },
            getRoles: (address: string | P2PMacAddress): Set<number> => {
                const addressString = getAddressString(address);
                return newNodeRoles.get(addressString) || new Set();
            },
            hasNode: (address: string | P2PMacAddress): boolean => {
                const addressString = getAddressString(address);
                return newNodeRoles.has(addressString);
            }
        }
    }
    return createNewRegistry(nodeRoles)
}