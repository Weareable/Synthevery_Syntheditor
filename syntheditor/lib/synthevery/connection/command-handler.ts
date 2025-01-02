import { CommandID, CommandResult } from '@/types/command';
import { ARQPacketHandler, ARQPacketHandlerImpl } from '@/lib/synthevery/connection/arq-packet-handler';
import EventEmitter from 'eventemitter3';

interface CommandHandlerEvents {
    commandCompleted: { command: CommandID };
    commandTimeout: { command: CommandID };
}

export interface CommandClientInterface {
    generateData(commandId: CommandID): Uint8Array;
    handleData(
        command: CommandID,
        data: Uint8Array
    ): [boolean, Uint8Array];
    handleAck(command: CommandID, data: Uint8Array): boolean;
    onComplete(commandId: CommandID): void;
    onTimeout(commandId: CommandID): void;
    getClientID(): number;
}

export interface CommandHandler {
    setClientInterface(clientInterface: CommandClientInterface): void;
    pushCommand(command: CommandID): boolean;
    clearQueue(): void;
    reset(): void;
    handlePacket(data: Uint8Array): void;
    eventEmitter: EventEmitter<CommandHandlerEvents>;
}

export class CommandHandlerImpl implements CommandHandler {
    private arqPacketHandler: ARQPacketHandler;
    private clientInterfaces: Map<number, CommandClientInterface> = new Map();
    private commandQueue: CommandID[] = [];
    private currentCommand: CommandID | null = null;
    eventEmitter = new EventEmitter<CommandHandlerEvents>();
    private packetSender: (data: Uint8Array) => void;
    private commandIDByteSize: number = 2;
    private commandResultByteSize: number = 3;

    constructor(
        packetSender: (data: Uint8Array) => void,
        resendInterval?: number,
        resendAttempts?: number,
    ) {
        this.packetSender = packetSender;
        this.arqPacketHandler = new ARQPacketHandlerImpl(
            (data) => this.packetSender(data),
            resendInterval,
            resendAttempts,
        );
        this.arqPacketHandler.setDataHandler((index, data) => this.handleData(index, data));
        this.arqPacketHandler.setAckHandler((index, data) => this.handleAck(index, data));
        this.arqPacketHandler.eventEmitter.on('ackCompleted', (event) => this.onAckCompleted(event.index));
        this.arqPacketHandler.eventEmitter.on('ackTimeout', (event) => this.onAckTimeout(event.index));
    }
    setClientInterface(clientInterface: CommandClientInterface): void {
        this.clientInterfaces.set(clientInterface.getClientID(), clientInterface);
    }
    pushCommand(command: CommandID): boolean {
        if (!this.clientInterfaces.has(command.client_id)) {
            // クライアントが見つからない場合は、エラーを返す
            console.error("Client not found");
            return false;
        }
        this.commandQueue.push(command);
        this.popCommand(); // コマンドを送信
        return true;
    }
    clearQueue(): void {
        this.commandQueue = [];
    }
    reset(): void {
        this.arqPacketHandler.reset();
        this.commandQueue = [];
        this.currentCommand = null;
    }
    handlePacket(data: Uint8Array): void {
        this.arqPacketHandler.handlePacket(data);
    }
    private popCommand(): void {
        if (this.commandQueue.length === 0) {
            console.debug("popCommand() : No command to pop!");
            return;
        }
        if (this.arqPacketHandler.isWaitingForAck()) {
            console.debug("popCommand() : Waiting for ack!");
            return;
        }
        const command = this.commandQueue.shift()!;
        this.currentCommand = command;
        const client = this.clientInterfaces.get(command.client_id);
        if (!client) {
            console.error("Client not found");
            return;
        }
        const data = client.generateData(command);
        const packetData = new Uint8Array(
            this.commandIDByteSize + data.length
        );
        packetData.set(new Uint8Array(new Uint8Array(new Uint8Array(Object.values(command)).buffer)), 0);
        packetData.set(data, this.commandIDByteSize);
        this.arqPacketHandler.sendPacket(packetData);
    }
    private handleData(index: number, data: Uint8Array): [boolean, Uint8Array] {
        if (data.length < this.commandIDByteSize) {
            console.error(
                `handleData() : invalid data length! ${data.length}`
            );
            return [false, new Uint8Array()];
        }
        const commandId = new Uint8Array(data.buffer, 0, this.commandIDByteSize);
        const client_id = commandId[0];
        const type = commandId[1];
        const command: CommandID = { client_id, type };
        const result = {
            command,
            result: 1,
        } as CommandResult;
        const client = this.clientInterfaces.get(command.client_id);
        if (!client) {
            console.warn(
                "handleData() : client not found, received command ignored."
            );
            result.result = 1; // CommandResult.kInvalidClientID
            return [true, new Uint8Array(new Uint8Array(Object.values(result)).buffer)];
        }
        result.result = 0; // CommandResult.kSuccess
        const [isSuccess, responseData] = client.handleData(
            command,
            data.slice(this.commandIDByteSize),
        );
        const response = new Uint8Array(new Uint8Array(Object.values(result)).buffer);
        const combinedResponse = new Uint8Array(response.length + responseData.length)
        combinedResponse.set(response);
        combinedResponse.set(responseData, response.length);
        console.debug(
            `handleData() : command handled, result=${isSuccess}`
        );
        return [isSuccess, combinedResponse];
    }
    private handleAck(index: number, data: Uint8Array): boolean {
        if (data.length < this.commandResultByteSize) {
            return false;
        }
        const result = new Uint8Array(data.buffer, 0, this.commandResultByteSize)
        const commandResult = { command: { client_id: result[0], type: result[1] }, result: result[2] } as CommandResult;

        if (commandResult.result === 1) { //CommandResult.kInvalidClientID
            console.error(
                `handleAck() : peer does not have the client ${commandResult.command.client_id}!`
            );
            return true;
        }
        const client = this.clientInterfaces.get(commandResult.command.client_id);
        if (!client) {
            console.error("handleAck() : client not found!");
            return true;
        }
        console.debug(`handleAck() : received `);
        return client.handleAck(commandResult.command, data.slice(this.commandResultByteSize));
    }
    private onAckCompleted(index: number): void {
        if (!this.currentCommand) {
            console.error("onAckCompleted : currentCommand is null");
            return;
        }
        this.eventEmitter.emit('commandCompleted', { command: this.currentCommand });
        const client = this.clientInterfaces.get(this.currentCommand.client_id);
        if (client) {
            client.onComplete(this.currentCommand);
        }
        this.currentCommand = null;
        this.popCommand(); // 次のコマンドを送信
    }
    private onAckTimeout(index: number): void {
        if (!this.currentCommand) {
            console.error("onAckTimeout : currentCommand is null");
            return;
        }
        this.eventEmitter.emit('commandTimeout', { command: this.currentCommand });
        const client = this.clientInterfaces.get(this.currentCommand.client_id);
        if (client) {
            client.onTimeout(this.currentCommand);
        }
        this.currentCommand = null;
        this.popCommand(); // 次のコマンドを送信
    }
}