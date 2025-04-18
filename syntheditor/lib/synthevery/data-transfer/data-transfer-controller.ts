// data-transfer/data-transfer-controller.ts

import { CommandHandler } from '@/lib/synthevery/connection/command-handler';
import { P2PMacAddress } from '@/types/mesh';
import {
    DataType,
    RequestData,
    ResponseData,
    RejectData,
    NextData,
    CancelData,
    ChunkData,
    CommandAck
} from './types';
import { SessionCommandID, SessionStatus, SessionID, CommandType } from './constants';
import { TransferCommandInterface, ReceiverPortInterface, SenderDataStoreInterface, ReceiverDataStoreInterface } from './interfaces';
import { SenderSession, ReceiverSession } from './session';
import { SenderSessionList, ReceiverSessionList } from './session-list';
import { DataTransferCommandClient } from './command-client';
import { getAddressString } from '@/lib/synthevery/connection/mesh-node';
import EventEmitter from 'eventemitter3';


export class DataTransferController implements TransferCommandInterface {
    private clientId: number;
    private dispatcher: { getCommandHandler: (address: P2PMacAddress, create: boolean) => CommandHandler | undefined }; // CommandProvider の Context
    private senderSessions: Map<string, SenderSessionList>;
    private receiverSessions: Map<string, ReceiverSessionList>;
    private receiverPorts: Map<DataType, ReceiverPortInterface>;
    private eventEmitter: EventEmitter;


    constructor(
        clientId: number,
        dispatcher: { getCommandHandler: (address: P2PMacAddress, create: boolean) => CommandHandler | undefined },
    ) {
        this.clientId = clientId;
        this.dispatcher = dispatcher;
        this.senderSessions = new Map<string, SenderSessionList>();
        this.receiverSessions = new Map<string, ReceiverSessionList>();
        this.receiverPorts = new Map();
        this.eventEmitter = new EventEmitter();

        setInterval(() => {
            this.senderSessions.forEach((senderSessionList) => {
                senderSessionList.checkSessions();
            });
            this.receiverSessions.forEach((receiverSessionList) => {
                receiverSessionList.checkSessions();
            });
        }, 500);
    }

    getEventEmitter(): EventEmitter {
        return this.eventEmitter;
    }

    registerReceiverPort(port: ReceiverPortInterface): void {
        this.receiverPorts.set(port.getDataType(), port);
    }

    initializeNode(address: P2PMacAddress): void {
        const addressStr = getAddressString(address.address);
        const handler = this.dispatcher.getCommandHandler(address, true);

        if (!handler) {
            console.error(`Failed to get CommandHandler for address: ${addressStr}`);
            return;
        }
        const client = new DataTransferCommandClient(this.clientId, this, address);
        handler.setClientInterface(client);
        this.senderSessions.set(addressStr, new SenderSessionList());
        this.receiverSessions.set(addressStr, new ReceiverSessionList());
    }

    sendRequest(
        receiver: P2PMacAddress,
        store: SenderDataStoreInterface
    ): { sessionId: SessionID; session: SenderSession } | null {
        const receiverStr = getAddressString(receiver.address);

        if (!this.senderSessions.has(receiverStr)) {
            console.error("DataTransferController: sendRequest: Invalid peer address");
            return null;
        }

        const senderSessionList = this.senderSessions.get(receiverStr)!;
        if (!senderSessionList.canAddSession()) {
            console.error("DataTransferController: sendRequest: Cannot add session");
            return null;
        }

        const session = new SenderSession(store);
        const sessionInfo = senderSessionList.registerSession(session);

        if (!sessionInfo) {
            console.error("DataTransferController: sendRequest: Failed to register session");
            return null;
        }
        //送受信のSession開始を通知
        this.eventEmitter.emit("sessionStart", receiver, sessionInfo.sessionId, "sender");

        this.sendCommand(receiver, SessionCommandID.kRequest, sessionInfo.sessionId);
        return sessionInfo;
    }

    // --- TransferCommandInterface の実装 ---

    getRequest(receiver: P2PMacAddress, sessionId: SessionID): { success: boolean; requestData?: RequestData } {
        const receiverStr = getAddressString(receiver.address);
        if (!this.senderSessions.has(receiverStr)) {
            return { success: false };
        }
        const session = this.senderSessions.get(receiverStr)!.getSession(sessionId);
        if (!session) {
            return { success: false };
        }
        return { success: true, requestData: session.getRequest() };
    }

    getResponse(sender: P2PMacAddress, sessionId: SessionID): { success: boolean; responseData?: ResponseData } {
        const senderStr = getAddressString(sender.address);

        if (!this.receiverSessions.has(senderStr)) {
            return { success: false };
        }

        const session = this.receiverSessions.get(senderStr)!.getSession(sessionId);
        if (!session) {
            return { success: false };
        }
        return { success: true, responseData: session.getResponse() };
    }

    getChunk(receiver: P2PMacAddress, sessionId: SessionID): { success: boolean; chunkData?: ChunkData } {
        const receiverStr = getAddressString(receiver.address);
        if (!this.senderSessions.has(receiverStr)) {
            return { success: false };
        }
        const session = this.senderSessions.get(receiverStr)!.getSession(sessionId);
        if (!session) {
            return { success: false };
        }
        return { success: true, chunkData: session.getChunk() };
    }

    getNext(sender: P2PMacAddress, sessionId: SessionID): { success: boolean; nextData?: NextData } {
        const senderStr = getAddressString(sender.address);
        if (!this.receiverSessions.has(senderStr)) {
            return { success: false };
        }
        const session = this.receiverSessions.get(senderStr)!.getSession(sessionId);
        if (!session) {
            return { success: false };
        }

        return { success: true, nextData: session.getNext() };
    }

    onRequest(sender: P2PMacAddress, sessionId: SessionID, data: RequestData): CommandAck['statusCode'] {
        const senderStr = getAddressString(sender.address);

        if (!this.receiverSessions.has(senderStr)) {
            return CommandAck.kStatusInvalidPeerAddress;
        }
        if (this.receiverSessions.get(senderStr)!.sessionExists(sessionId)) {
            return CommandAck.kStatusInvalidSessionID;
        }

        if (!this.receiverPorts.has(data.type)) {
            return CommandAck.kStatusInvalidDataType;
        }

        // 非同期処理 (C++ コードの async_command_timer_list_ を模倣)
        Promise.resolve().then(() => {
            const result = this.receiverPorts.get(data.type)!.handleRequest(sender, sessionId, data);
            const store = result.receiver;
            const response = result.responseData

            if (store) {
                const session = new ReceiverSession(store);
                const success = this.receiverSessions.get(senderStr)!.registerSession(sessionId, session);
                if (!success) {
                    return;
                }
                //送受信のSession開始を通知
                this.eventEmitter.emit("sessionStart", sender, sessionId, "receiver");
                session.onRequest(data);
            }
            this.sendCommand(sender, SessionCommandID.kResponse, sessionId);
        });
        return CommandAck.kStatusOK;
    }

    onResponse(receiver: P2PMacAddress, sessionId: SessionID, data: ResponseData): CommandAck['statusCode'] {
        const receiverStr = getAddressString(receiver.address);
        if (!this.senderSessions.has(receiverStr)) {
            return CommandAck.kStatusInvalidPeerAddress;
        }
        const session = this.senderSessions.get(receiverStr)!.getSession(sessionId);
        if (!session) {
            return CommandAck.kStatusInvalidSessionID;
        }

        session.onResponse(data);

        if (data.isAccepted) {
            this.sendCommand(receiver, SessionCommandID.kChunk, sessionId);
        }
        return CommandAck.kStatusOK;
    }

    onCancel(sender: P2PMacAddress, sessionId: SessionID, data: CancelData): CommandAck['statusCode'] {
        const senderStr = getAddressString(sender.address);
        if (!this.receiverSessions.has(senderStr)) {
            return CommandAck.kStatusInvalidPeerAddress;
        }
        const session = this.receiverSessions.get(senderStr)!.getSession(sessionId);
        if (!session) {
            return CommandAck.kStatusInvalidSessionID;
        }
        session.onCancel(data);
        return CommandAck.kStatusOK;
    }

    onReject(receiver: P2PMacAddress, sessionId: SessionID, data: RejectData): CommandAck['statusCode'] {
        const receiverStr = getAddressString(receiver.address);
        if (!this.senderSessions.has(receiverStr)) {
            return CommandAck.kStatusInvalidPeerAddress;
        }
        const session = this.senderSessions.get(receiverStr)!.getSession(sessionId);
        if (!session) {
            return CommandAck.kStatusInvalidSessionID;
        }
        session.onReject(data);
        return CommandAck.kStatusOK;
    }

    onChunk(sender: P2PMacAddress, sessionId: SessionID, data: ChunkData): CommandAck['statusCode'] {
        const senderStr = getAddressString(sender.address);

        if (!this.receiverSessions.has(senderStr)) {
            return CommandAck.kStatusInvalidPeerAddress;
        }
        const session = this.receiverSessions.get(senderStr)!.getSession(sessionId);
        if (!session) {
            return CommandAck.kStatusInvalidSessionID;
        }

        session.onChunk(data);

        if (session.getStatus() === SessionStatus.kStatusInvalidPosition) {
            return CommandAck.kStatusInvalidPosition;
        }

        if (session.getStatus() === SessionStatus.kStatusCompleted) {
            this.sendCommand(sender, SessionCommandID.kComplete, sessionId);
            return CommandAck.kStatusOK;
        }

        this.sendCommand(sender, SessionCommandID.kNext, sessionId);
        return CommandAck.kStatusOK;
    }

    onNext(receiver: P2PMacAddress, sessionId: SessionID, data: NextData): CommandAck['statusCode'] {
        const receiverStr = getAddressString(receiver.address);
        if (!this.senderSessions.has(receiverStr)) {
            return CommandAck.kStatusInvalidPeerAddress;
        }
        const session = this.senderSessions.get(receiverStr)!.getSession(sessionId);

        if (!session) {
            return CommandAck.kStatusInvalidSessionID;
        }

        session.onNext(data);

        if (session.getStatus() === SessionStatus.kStatusInvalidPosition) {
            return CommandAck.kStatusInvalidPosition;
        }

        this.sendCommand(receiver, SessionCommandID.kChunk, sessionId);
        return CommandAck.kStatusOK;
    }

    onComplete(receiver: P2PMacAddress, sessionId: SessionID): CommandAck['statusCode'] {
        const receiverStr = getAddressString(receiver.address);
        if (!this.senderSessions.has(receiverStr)) {
            return CommandAck.kStatusInvalidPeerAddress;
        }
        const session = this.senderSessions.get(receiverStr)!.getSession(sessionId);
        if (!session) {
            return CommandAck.kStatusInvalidSessionID;
        }
        session.onComplete();
        return CommandAck.kStatusOK;
    }

    onSuccess(peer: P2PMacAddress, commandType: CommandType, sessionId: SessionID): void {
        // 必要に応じて成功時の処理をここに記述 (今回は特に処理なし)
        this.eventEmitter.emit("commandSuccess", peer, commandType, sessionId); //成功を通知
    }

    onError(peer: P2PMacAddress, commandType: CommandType, sessionId: SessionID, statusCode: number): void {
        const peerStr = getAddressString(peer.address);

        // --- C++の最初のswitch文に対応 ---
        switch (commandType) {
            // 送信側コマンドのエラー
            case SessionCommandID.kRequest:
            case SessionCommandID.kChunk:
            case SessionCommandID.kCancel:
                if (!this.senderSessions.has(peerStr)) {
                    console.error("DataTransferController: onError: Invalid peer address");
                    return; // 早期return
                }
                if (!this.senderSessions.get(peerStr)!.getSession(sessionId)) {
                    console.error("DataTransferController: onError: Invalid session ID");
                    return; // 早期return
                }
                break;

            // 受信側コマンドのエラー
            case SessionCommandID.kResponse:
            case SessionCommandID.kNext:
            case SessionCommandID.kComplete:
            case SessionCommandID.kReject:
                if (!this.receiverSessions.has(peerStr)) {
                    console.error("DataTransferController: onError: Invalid peer address");
                    return; // 早期return
                }
                if (!this.receiverSessions.get(peerStr)!.getSession(sessionId)) {
                    console.error("DataTransferController: onError: Invalid session ID");
                    return; // 早期return
                }
                break;
        }

        // --- C++の2番目のswitch文に対応 ---
        switch (statusCode) {
            case CommandAck.kStatusInvalidSessionID:
                console.error("DataTransferController: onErrorSender: Invalid session ID");
                break;
            case CommandAck.kStatusInvalidPeerAddress:
                console.error("DataTransferController: onErrorSender: Invalid peer address");
                break;
            case CommandAck.kStatusInvalidDataType:
                console.error("DataTransferController: onErrorSender: Invalid data type");
                break;
            case CommandAck.kStatusReceiverStoreNotReady:
                console.error("DataTransferController: onErrorSender: Receiver store not ready");
                break;
            case CommandAck.kStatusNotHandled:
                console.error("DataTransferController: onErrorSender: Not handled");
                break;
            case CommandAck.kStatusInvalidPosition:
                console.error("DataTransferController: onErrorSender: Invalid position");
                this.sendCommand(peer, commandType, sessionId); // 再送
                break;
            case CommandAck.kStatusInvalidCRC:
                console.error("DataTransferController: onErrorSender: Invalid CRC");
                this.sendCommand(peer, commandType, sessionId); // 再送
                break;
            case CommandAck.kStatusInvalidData:
                console.error("DataTransferController: onErrorSender: Invalid data");
                this.sendCommand(peer, commandType, sessionId); // 再送
                break;
            case CommandAck.kStatusTimeout:
                console.error("DataTransferController: onErrorSender: Timeout");
                break;
            default:
                console.error("DataTransferController: onErrorSender: Unknown error");
                return;
        }
        this.eventEmitter.emit("commandError", peer, commandType, sessionId, statusCode); //Errorを通知
    }

    // 内部メソッド
    private sendCommand(
        peerAddress: P2PMacAddress,
        commandType: CommandType,
        sessionId: SessionID
    ): void {
        const commandIdType = SessionCommandID.toCommandIDType(commandType, sessionId);
        const handler = this.dispatcher.getCommandHandler(peerAddress, false); // create = false

        if (!handler) {
            console.warn(`Could not get command handler for ${peerAddress}`);
            return;
        }

        handler.pushCommand({ client_id: this.clientId, type: commandIdType });
    }
}