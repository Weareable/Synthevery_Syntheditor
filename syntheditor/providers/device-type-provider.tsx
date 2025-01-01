// role-context.tsx
'use client';

import React, {
    createContext,
    useContext,
    PropsWithChildren,
    useCallback,
    useMemo,
    useRef,
    useEffect,
    useState,
} from 'react';
import {
    P2PMacAddress,
    MeshPacket,
} from '@/types/mesh';
import { useMeshContext } from '@/providers/mesh-provider';
import { createRoleRegistry, RoleRegistry } from '@/lib/synthevery/connection/node-role';
import { MESH_PACKET_TYPE_DEVICE_TYPE, DEVICE_TYPE_APP } from '@/lib/synthevery/connection/constants';
import { refreshRegistry } from '@/lib/synthevery/connection/node-role-synchronizer';
import { handleRolePacket } from '@/lib/synthevery/connection/role-packet-handler';

interface DeviceTypeContextValue {
    registry: RoleRegistry | null;
}

const DeviceTypeContext = createContext<DeviceTypeContextValue | null>(null);

export function DeviceTypeProvider({ children }: PropsWithChildren) {

    const { sendPacket, getAddress, isMeshReady, setCallback, removeCallback } = useMeshContext();

    // --- Refs ---
    const [registry, setRegistry] = useState<RoleRegistry | null>(null);
    const registryRef = useRef<RoleRegistry | null>(null);

    /*
    // --- Effects ---
    useEffect(() => {
        // create registry
        if (isMeshReady) {
            registryRef.current = createRoleRegistry(MESH_PACKET_TYPE_DEVICE_TYPE).registerRole(getAddress(), DEVICE_TYPE_APP);
            setRegistry(registryRef.current);
            console.log('create registry');
            console.log(registryRef.current);
        }

        // send role request
        let intervalId: NodeJS.Timeout | null = null;

        if (isMeshReady) {
            const sendRoleRequest = async () => {
                if (registryRef.current) {
                    console.log('send role request');
                    console.log(registryRef.current);
                    setRegistry(registryRef.current);
                    await refreshRegistry(sendPacket, registryRef.current, getAddress, true);
                }
            };

            sendRoleRequest();

            intervalId = setInterval(sendRoleRequest, 1000);
        }

        // --- handle role packet ---
        if (isMeshReady) {
            setCallback(MESH_PACKET_TYPE_DEVICE_TYPE, (packet: MeshPacket) => {
                console.log('received role packet');
                console.log(packet);
                if (registryRef.current) {
                    handleRolePacket(sendPacket, getAddress, registryRef.current, packet, (receivedRegistry: RoleRegistry) => {
                        setRegistry(receivedRegistry);
                        registryRef.current = receivedRegistry;
                        console.log('update role packet to:');
                        console.log(receivedRegistry);
                    });
                }
            });
        } else {
            removeCallback(MESH_PACKET_TYPE_DEVICE_TYPE);
        }

        return () => {
            if (intervalId) {
                // clean up
                clearInterval(intervalId);
            }
        };

    }, [isMeshReady]);
    */
    useEffect(() => {
        if (isMeshReady) {
            const roleRegistry = createRoleRegistry(MESH_PACKET_TYPE_DEVICE_TYPE).registerRole(getAddress(), DEVICE_TYPE_APP);
            setRegistry(roleRegistry);
            console.log('create registry');
            console.log(roleRegistry);

            // --- send role request ---
            const sendRoleRequest = async () => {
                if (roleRegistry) {
                    console.log('send role request');
                    console.log(roleRegistry);
                    await refreshRegistry(sendPacket, roleRegistry, getAddress, true);
                }
            };

            sendRoleRequest();
            const intervalId = setInterval(sendRoleRequest, 1000);

            // --- handle role packet ---
            const handlePacket = (packet: MeshPacket) => {
                console.log('received role packet');
                console.log(packet);

                handleRolePacket(sendPacket, getAddress, roleRegistry, packet, (updatedRegistry: RoleRegistry) => {
                    console.log('update role packet to:');
                    console.log(updatedRegistry);
                    setRegistry({ ...updatedRegistry }); // Trigger re-render here
                });
            };

            setCallback(MESH_PACKET_TYPE_DEVICE_TYPE, handlePacket);

            return () => {
                clearInterval(intervalId);
                removeCallback(MESH_PACKET_TYPE_DEVICE_TYPE);
            };
        }
    }, [isMeshReady, sendPacket, getAddress, setCallback, removeCallback]);

    useEffect(() => {
        if (registryRef.current) {
            setRegistry(registryRef.current);
        }
    }, [registryRef.current]);

    return (
        <DeviceTypeContext.Provider value={{ registry }}>
            {children}
        </DeviceTypeContext.Provider>
    );
}

/**
 * DeviceTypeコンテキストを取得するためのフック
 */
export function useDeviceTypeContext() {
    const context = useContext(DeviceTypeContext);
    if (!context) {
        throw new Error('useDeviceTypeContext must be used within DeviceTypeProvider');
    }
    return context;
}
