// data-transfer/interfaces.ts

import { P2PMacAddress } from '../types/mesh';
import { RequestData, ResponseData, RejectData, NextData, CancelData, ChunkData, CommandAck, DataType, ResultData } from '../types/data-transfer';
import { SessionID, CommandType, SessionStatusType } from './constants';

export interface TransferCommandInterface {
    getRequest(sender: P2PMacAddress, sessionId: SessionID): { success: boolean, requestData?: RequestData };
    getResponse(receiver: P2PMacAddress, sessionId: SessionID): { success: boolean, responseData?: ResponseData };

    onRequest(sender: P2PMacAddress, sessionId: SessionID, data: RequestData): CommandAck['statusCode'];
    onResponse(receiver: P2PMacAddress, sessionId: SessionID, data: ResponseData): CommandAck['statusCode'];
    onCancel(sender: P2PMacAddress, sessionId: SessionID, data: CancelData): CommandAck['statusCode'];
    onReject(receiver: P2PMacAddress, sessionId: SessionID, data: RejectData): CommandAck['statusCode'];
    onResult(receiver: P2PMacAddress, sessionId: SessionID, data: ResultData): CommandAck['statusCode'];

    onSuccess(peer: P2PMacAddress, commandType: CommandType, sessionId: SessionID): void;
    onError(peer: P2PMacAddress, commandType: CommandType, sessionId: SessionID, statusCode: number): void;
}

/*
export interface DataStoreInterface {
    sender: {
        size(): number;
        type(): DataType;
        get(offset: number, size: number): Uint8Array;
        metadata(): string;
    };
    receiver: {
        write(data: Uint8Array, offset: number): void;
        size(): number;
    } | null;
}
    */

export interface SenderDataStoreInterface {
    size(): number;
    type(): DataType;
    get(offset: number, size: number): Uint8Array;
    metadata(): string;
}

export interface ReceiverDataStoreInterface {
    write(data: Uint8Array, offset: number): void;
    size(): number;
}


export interface ReceiverPortInterface {
    getDataType(): DataType;
    handleRequest(
        sender: P2PMacAddress,
        sessionId: SessionID,
        data: RequestData
    ): {
        receiver: ReceiverDataStoreInterface,
        responseData: ResponseData
    }
    onStart(session: ReceiverSessionInterface, id: SessionID): void;
    onFinish(session: ReceiverSessionInterface, id: SessionID): void;
}

// --- Session関連のインターフェースを修正 ---
export interface SenderSessionInterface {
    getPosition(): number;
    getStatus(): SessionStatusType;
    getRequest(): RequestData;
    onResponse(data: ResponseData): void;
    alive(): boolean;
    onReject(data: RejectData): void;
    onResult(data: ResultData): void;
}

export interface ReceiverSessionInterface {
    getPosition(): number;
    getStatus(): SessionStatusType;
    onRequest(data: RequestData): void;
    getResponse(): ResponseData;
    alive(): boolean;
    onCancel(data: CancelData): void;
    getRequest(): RequestData;
}

// 読み取り専用のインターフェース (オプション)
export interface ReadOnlySenderSessionInterface {
    getPosition(): number;
    getStatus(): number;
    alive(): boolean;
}

export interface ReadOnlyReceiverSessionInterface {
    getPosition(): number;
    getStatus(): number;
    alive(): boolean;
}