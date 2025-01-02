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


interface CommandProviderProps {
    children: React.ReactNode;
}

interface CommandContextValue {
    registerClient: (client: CommandClientInterface) => void;
    pushCommand: (nodeAddress: P2PMacAddress, command: CommandID) => void;
    getEventEmitter: (nodeAddress: P2PMacAddress) => EventEmitter<any> | undefined;
}

const CommandContext = createContext<CommandContextValue | null>(null);

export function CommandProvider({ children }: CommandProviderProps) {
    const { sendPacket, setCallback, connectedDevices } = useMeshContext();
    const commandHandlersRef = useRef<Map<string, CommandHandler>>(new Map());
    const clientInterfacesRef = useRef<Map<number, CommandClientInterface>>(new Map());

    // connectedDevices の変更を監視し、CommandHandler のインスタンスを作成/削除
    useEffect(() => {
        if (!commandHandlersRef.current) return;
        // 既存のCommandHandlerの削除
        commandHandlersRef.current.forEach((handler, address) => {
            if (!connectedDevices.some(device => JSON.stringify(device.address) === address)) {
                commandHandlersRef.current?.delete(address);
            }
        });
        // 新しいCommandHandlerの作成
        connectedDevices.forEach(device => {
            const address = JSON.stringify(device.address);
            if (!commandHandlersRef.current?.has(address)) {
                const handler = new CommandHandlerImpl(
                    (data) => {
                        sendPacket(MESH_PACKET_TYPE_COMMAND, device, data);
                    },
                    undefined, // TimerListを渡さない
                );
                commandHandlersRef.current?.set(address, handler);
            }
        });
        return () => {
            commandHandlersRef.current?.clear();
        };
    }, [connectedDevices, sendPacket]);
    const registerClient = useCallback((client: CommandClientInterface) => {
        clientInterfacesRef.current.set(client.getClientID(), client);
        commandHandlersRef.current?.forEach(handler => {
            handler.setClientInterface(client);
        });
    }, []);

    const pushCommand = useCallback((nodeAddress: P2PMacAddress, command: CommandID) => {
        const address = JSON.stringify(nodeAddress.address);
        const handler = commandHandlersRef.current?.get(address);
        handler?.pushCommand(command);
    }, []);
    const getEventEmitter = useCallback((nodeAddress: P2PMacAddress) => {
        const address = JSON.stringify(nodeAddress.address);
        return commandHandlersRef.current?.get(address)?.eventEmitter;
    }, []);

    const value: CommandContextValue = {
        registerClient,
        pushCommand,
        getEventEmitter,
    };

    useEffect(() => {
        const handlePacket = (packet: MeshPacket) => {
            if (packet.type !== MESH_PACKET_TYPE_COMMAND) return;
            const address = JSON.stringify(packet.source.address);
            commandHandlersRef.current?.get(address)?.handlePacket(packet.data);
        };
        setCallback(MESH_PACKET_TYPE_COMMAND, handlePacket)
        return () => {
            setCallback(MESH_PACKET_TYPE_COMMAND, () => { }); // クリーンアップ
        }
    }, [setCallback]);
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