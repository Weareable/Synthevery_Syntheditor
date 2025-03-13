"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    useCallback,
    PropsWithChildren,
} from 'react';
import { CommandID } from '@/types/command';
import {
    CommandHandler,
    CommandClientInterface,
    CommandHandlerImpl,
} from '@/lib/synthevery/connection/command-handler';
import { useMeshContext } from './mesh-provider';
import { P2PMacAddress, MeshPacket } from '@/types/mesh';
import EventEmitter from 'eventemitter3';
import { MESH_PACKET_TYPE_COMMAND } from '@/lib/synthevery/connection/constants';
import { ARQPacketHandlerImpl } from '@/lib/synthevery/connection/arq-packet-handler';
import { equalsAddress, getAddressString } from '@/lib/synthevery/connection/mesh-node';


interface CommandProviderProps {
    children: React.ReactNode;
}

export interface CommandContextValue {
    getCommandHandler: (nodeAddress: P2PMacAddress, create: boolean) => CommandHandler | undefined;
    getEventEmitter: (nodeAddress: P2PMacAddress) => EventEmitter<any> | undefined;
    isAvailable: (nodeAddress: P2PMacAddress) => boolean;
}

const CommandContext = createContext<CommandContextValue | null>(null);

export function CommandProvider({ children }: CommandProviderProps) {
    const { sendPacket, setCallback, connectedDevices, removeCallback } = useMeshContext();
    const commandHandlersRef = useRef<Map<string, CommandHandler>>(new Map());

    const getCommandHandler = useCallback((nodeAddress: P2PMacAddress, create: boolean) => {
        const address = getAddressString(nodeAddress.address);
        const handler = commandHandlersRef.current?.get(address);
        console.log("getCommandHandler(): handler=", handler);
        if (!handler && create) {
            console.log("getCommandHandler(): creating handler for address=", address);
            commandHandlersRef.current?.set(address, new CommandHandlerImpl(
                (data) => {
                    sendPacket(MESH_PACKET_TYPE_COMMAND, nodeAddress, data);
                },
                new ARQPacketHandlerImpl(
                    (data) => {
                        sendPacket(MESH_PACKET_TYPE_COMMAND, nodeAddress, data);
                    },
                    1000,
                    3
                )
            ));
            return commandHandlersRef.current?.get(address);
        }
        return handler;
    }, [commandHandlersRef, sendPacket]);

    const getEventEmitter = useCallback((nodeAddress: P2PMacAddress) => {
        const address = getAddressString(nodeAddress.address);
        return commandHandlersRef.current?.get(address)?.eventEmitter;
    }, []);

    const isAvailable = useCallback((nodeAddress: P2PMacAddress) => {
        const hasNode = connectedDevices.some(device => equalsAddress(device, nodeAddress));
        const hasHandler = commandHandlersRef.current?.has(getAddressString(nodeAddress.address));
        return hasNode && hasHandler;
    }, [connectedDevices]);

    const value: CommandContextValue = {
        getCommandHandler,
        getEventEmitter,
        isAvailable,
    };

    useEffect(() => {
        const handlePacket = (packet: MeshPacket) => {
            if (packet.type !== MESH_PACKET_TYPE_COMMAND) return;
            const address = getAddressString(packet.source.address);
            commandHandlersRef.current?.get(address)?.handlePacket(packet.data);
        };
        setCallback(MESH_PACKET_TYPE_COMMAND, handlePacket)
        return () => {
            removeCallback(MESH_PACKET_TYPE_COMMAND);
        }
    }, [setCallback, removeCallback]);
    return (
        <CommandContext.Provider value={value}>
            {children}
        </CommandContext.Provider>
    );
}

export function useCommandContext() {
    const context = useContext(CommandContext);
    if (!context) {
        throw new Error('useCommandContext must be used within CommandProvider');
    }
    return context;
}