import { P2PMacAddress } from '../types/mesh';
import { CommandHandler, CommandHandlerImpl } from './handler';
import { ARQPacketHandlerImpl } from '../connection/arq-packet-handler';
import { mesh } from '../connection/mesh';
import { getAddressString } from '../connection/util';
import { MESH_PACKET_TYPE_COMMAND } from '../connection/constants';
import { MeshPacket } from '../types/mesh';
const COMMAND_TIMEOUT = 1000;
const COMMAND_RETRY_COUNT = 3;

class CommandDispatcher {
    private commandHandlers: Map<string, CommandHandler> = new Map();

    constructor() {
        mesh.setCallback(MESH_PACKET_TYPE_COMMAND, this.handlePacket.bind(this));
    }

    getCommandHandler(nodeAddress: P2PMacAddress, create: boolean): CommandHandler | undefined {
        const address = getAddressString(nodeAddress.address);
        const handler = this.commandHandlers.get(address);

        if (handler === undefined && create) {
            console.log("create new handler for ", getAddressString(nodeAddress.address));
            const newHandler = new CommandHandlerImpl(
                (data) => {
                    mesh.sendPacket(MESH_PACKET_TYPE_COMMAND, nodeAddress, data);
                },
                new ARQPacketHandlerImpl(
                    (data) => {
                        mesh.sendPacket(MESH_PACKET_TYPE_COMMAND, nodeAddress, data);
                    },
                    COMMAND_TIMEOUT,
                    COMMAND_RETRY_COUNT
                ),
                getAddressString(nodeAddress.address)
            );
            this.commandHandlers.set(address, newHandler);
            return newHandler;
        }
        return handler;
    }

    hasHandler(nodeAddress: P2PMacAddress): boolean {
        const address = getAddressString(nodeAddress.address);
        return this.commandHandlers.has(address);
    }

    isAvailable(nodeAddress: P2PMacAddress): boolean {
        return mesh.isAvailable(nodeAddress) && this.hasHandler(nodeAddress);
    }

    private handlePacket(packet: MeshPacket) {
        const address = getAddressString(packet.source.address);
        const handler = this.commandHandlers.get(address);
        if (handler) {
            handler.handlePacket(packet.data);
        }
    }
}

export const commandDispatcher = new CommandDispatcher();
