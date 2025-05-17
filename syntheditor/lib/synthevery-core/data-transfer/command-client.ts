// data-transfer/data-transfer-client.ts
import { CommandID } from '../types/command';
import { P2PMacAddress } from '../types/mesh';
import {
    DataType,
    RequestData,
    ResponseData,
    RejectData,
    NextData,
    CancelData,
    ChunkData,
    ResultData,
    CommandAck,
    serializeCRCPacket,
    deserializeCRCPacket,
    serializeCommandAck,
    deserializeCommandAck,
    serializeCancelData,
    serializeRejectData,
    serializeRequestData,
    serializeResponseData,
    deserializeCancelData,
    deserializeRequestData,
    deserializeResponseData,
    deserializeRejectData,
    deserializeResultData,
    serializeResultData
} from '../types/data-transfer';
import { SessionCommandID } from './constants';
import { TransferCommandInterface } from './interfaces';
import { CommandClientInterface } from '../command/handler';

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
            case SessionCommandID.kResult: {
                return serializeResultData({ result: 0 }); //仮
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
            case SessionCommandID.kResult: {
                const packet = deserializeResultData(data);
                if (!packet) {
                    return [false, serializeCommandAck(CommandAck.kStatusInvalidData)];
                }
                const ack = this.commands.onResult(this.peerAddress, sessionId, packet);
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