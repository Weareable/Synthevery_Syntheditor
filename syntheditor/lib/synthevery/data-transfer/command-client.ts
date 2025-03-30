// data-transfer/data-transfer-client.ts
import { CommandID } from '@/types/command';
import { P2PMacAddress } from '@/types/mesh';
import {
    DataType,
    RequestData,
    ResponseData,
    RejectData,
    NextData,
    CancelData,
    ChunkData,
    CompleteData,
    CommandAck,
    serializeCRCPacket,
    deserializeCRCPacket,
    serializeCommandAck,
    deserializeCommandAck,
    serializeChunkData,
    serializeNextData,
    serializeCompleteData,
    serializeCancelData,
    serializeRejectData,
    serializeRequestData,
    serializeResponseData,
    deserializeChunkData,
    deserializeNextData,
    deserializeRequestData,
    deserializeResponseData,
    deserializeCancelData,
    deserializeRejectData
} from './types';
import { SessionCommandID } from './constants';
import { TransferCommandInterface } from './interfaces';
import { CommandClientInterface } from '@/lib/synthevery/connection/command-handler';

export class DataTransferCommandClient implements CommandClientInterface {
    private clientId: number;
    private commands: TransferCommandInterface;
    private peerAddress: P2PMacAddress;

    constructor(clientId: number, commands: TransferCommandInterface, peerAddress: P2PMacAddress) {
        this.clientId = clientId;
        this.commands = commands;
        this.peerAddress = peerAddress;
    }

    generateData(commandId: CommandID): Uint8Array {
        const { commandType, sessionId } = SessionCommandID.fromCommandID(commandId.type);

        switch (commandType) {
            case SessionCommandID.kChunk: {
                const result = this.commands.getChunk(this.peerAddress, sessionId);
                if (!result.success || !result.chunkData) {
                    return new Uint8Array();
                }
                return serializeCRCPacket(result.chunkData, serializeChunkData);
            }
            case SessionCommandID.kNext: {
                const result = this.commands.getNext(this.peerAddress, sessionId);
                if (!result.success || !result.nextData) {
                    return new Uint8Array();
                }
                return serializeCRCPacket(result.nextData, serializeNextData);
            }
            case SessionCommandID.kComplete: {
                return serializeCompleteData({ result: 0 }); //仮
            }
            case SessionCommandID.kRequest: { // 追加
                const result = this.commands.getRequest(this.peerAddress, sessionId);
                if (!result.success || !result.requestData) {
                    return new Uint8Array();
                }
                return serializeCRCPacket(result.requestData, serializeRequestData);
            }
            case SessionCommandID.kResponse: { // 追加
                const result = this.commands.getResponse(this.peerAddress, sessionId);

                if (!result.success || !result.responseData) {
                    return new Uint8Array();
                }
                return serializeResponseData(result.responseData);
            }
            case SessionCommandID.kCancel: {
                return serializeCancelData({ reason: 0 }); // 仮
            }
            case SessionCommandID.kReject: {
                return serializeRejectData({ reason: 0 }); // 仮
            }
            default:
                return new Uint8Array();
        }
    }


    handleData(command: CommandID, data: Uint8Array): [boolean, Uint8Array] {
        const { commandType, sessionId } = SessionCommandID.fromCommandID(command.type);
        switch (commandType) {
            case SessionCommandID.kChunk: {
                const packet = deserializeCRCPacket(data, deserializeChunkData);
                if (!packet) {
                    return [false, serializeCommandAck(CommandAck.kStatusInvalidCRC)];
                }
                const ack = this.commands.onChunk(this.peerAddress, sessionId, packet.data);
                return [true, serializeCommandAck(ack)];
            }
            case SessionCommandID.kNext: {
                const packet = deserializeCRCPacket(data, deserializeNextData);
                if (!packet) {
                    return [false, serializeCommandAck(CommandAck.kStatusInvalidData)];
                }
                const ack = this.commands.onNext(this.peerAddress, sessionId, packet.data);
                return [true, serializeCommandAck(ack)];
            }
            case SessionCommandID.kComplete: {
                const ack = this.commands.onComplete(this.peerAddress, sessionId);
                return [true, serializeCommandAck(ack)];
            }
            case SessionCommandID.kRequest: {
                const packet = deserializeCRCPacket(data, deserializeRequestData);
                if (!packet) {
                    return [false, serializeCommandAck(CommandAck.kStatusInvalidCRC)];
                }
                const ack = this.commands.onRequest(this.peerAddress, sessionId, packet.data);
                return [true, serializeCommandAck(ack)];
            }
            case SessionCommandID.kResponse: {
                const response = deserializeResponseData(data);
                if (!response) {
                    return [false, serializeCommandAck(CommandAck.kStatusInvalidData)];
                }
                const ack = this.commands.onResponse(this.peerAddress, sessionId, response);
                return [true, serializeCommandAck(ack)];
            }
            case SessionCommandID.kCancel: {
                const cancel = deserializeCancelData(data);
                if (!cancel) {
                    return [false, serializeCommandAck(CommandAck.kStatusInvalidData)];
                }
                const ack = this.commands.onCancel(this.peerAddress, sessionId, cancel);
                return [true, serializeCommandAck(ack)];
            }
            case SessionCommandID.kReject: {
                const reject = deserializeRejectData(data);
                if (!reject) {
                    return [false, serializeCommandAck(CommandAck.kStatusInvalidData)];
                }
                const ack = this.commands.onReject(this.peerAddress, sessionId, reject);
                return [true, serializeCommandAck(ack)];
            }
            default:
                return [false, serializeCommandAck(CommandAck.kStatusNotHandled)];
        }
    }
    handleAck(command: CommandID, data: Uint8Array): boolean {
        const { commandType, sessionId } = SessionCommandID.fromCommandID(command.type);
        const ack = deserializeCommandAck(data);

        if (!ack) {
            console.error("Command ack: deserializeData failed");
            return false;
        }

        switch (ack.statusCode) {
            case CommandAck.kStatusOK: {
                this.commands.onSuccess(this.peerAddress, commandType, sessionId);
                return true;
            }
            default: {
                this.commands.onError(this.peerAddress, commandType, sessionId, ack.statusCode);
                return true;
            }
        }
    }

    onComplete(commandId: CommandID): void {
        // (今回は特に処理なし)
    }

    onTimeout(commandId: CommandID): void {
        const { commandType, sessionId } = SessionCommandID.fromCommandID(commandId.type);
        this.commands.onError(this.peerAddress, commandType, sessionId, CommandAck.kStatusTimeout);
    }

    getClientID(): number {
        return this.clientId;
    }
}