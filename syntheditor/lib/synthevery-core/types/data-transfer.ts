// data-transfer/types.ts
import { P2PMacAddress } from '@/types/mesh';
import * as msgpack from "@msgpack/msgpack";
import { calculateCRC32 } from '@/lib/synthevery/data-transfer/crc';
import { SessionCommandID, SessionID } from '@/lib/synthevery/data-transfer/constants';
export type DataType = number;

export interface RequestData {
    type: DataType;
    metadata: string;
    totalSize: number;
    chainNodes: P2PMacAddress[];
}

export interface ResponseData {
    isAccepted: boolean;
    reason: number;
}

export interface RejectData {
    reason: number;
}

export interface NextData {
    position: number;
}

export interface CancelData {
    reason: number;
}

export interface ChunkData {
    position: number;
    data: Uint8Array;
}

export interface ResultData {
    result: number;
}

export interface CommandAck {
    statusCode: number;
}

// CommandAck の定数は types.ts に移動しても良い
export namespace CommandAck {
    export const kStatusOK: CommandAck['statusCode'] = 0x00;
    export const kStatusInvalidCommand: CommandAck['statusCode'] = 0x01;
    export const kStatusInvalidCRC: CommandAck['statusCode'] = 0x02;
    export const kStatusInvalidData: CommandAck['statusCode'] = 0x03;
    export const kStatusInvalidPosition: CommandAck['statusCode'] = 0x04;
    export const kStatusInvalidSessionID: CommandAck['statusCode'] = 0x05;
    export const kStatusInvalidPeerAddress: CommandAck['statusCode'] = 0x06;
    export const kStatusInvalidDataType: CommandAck['statusCode'] = 0x07;
    export const kStatusReceiverStoreNotReady: CommandAck['statusCode'] = 0x08;
    export const kStatusNotHandled: CommandAck['statusCode'] = 0x09;
    export const kStatusTimeout: CommandAck['statusCode'] = 0x0a;
}

export function isValidSessionID(sessionId: SessionID): boolean {
    return sessionId <= SessionCommandID.kSessionIDMask;
}

// --- シリアライズ/デシリアライズ関数 ---
export function serializeRequestData(data: RequestData): Uint8Array {
    const chainNodesArray = new Uint8Array(data.chainNodes.length * 6);
    for (let i = 0; i < data.chainNodes.length; i++) {
        const node = data.chainNodes[i];
        chainNodesArray.set(node.address, i * 6);
    }
    console.log("serializeRequestData", data.type, data.metadata, data.totalSize, chainNodesArray);
    return msgpack.encode([data.type, data.metadata, data.totalSize, chainNodesArray]);
}

export function deserializeRequestData(data: Uint8Array): RequestData | null {
    try {
        const decoded = msgpack.decode(data) as any[]; // 配列としてデコード
        const type = decoded[0] as DataType;
        const metadata = decoded[1] as string;
        const totalSize = decoded[2] as number;
        const chainNodes = (decoded[3] as number[][]).map(addressArray => ({ address: new Uint8Array(addressArray) }));

        return { type, metadata, totalSize, chainNodes };
    } catch (error) {
        console.error("deserializeRequestData failed: ", error);
        return null;
    }
}

export function serializeResponseData(data: ResponseData): Uint8Array {
    return msgpack.encode([data.isAccepted, data.reason]);
}

export function deserializeResponseData(data: Uint8Array): ResponseData | null {
    try {
        const decoded = msgpack.decode(data) as [boolean, number];
        return { isAccepted: decoded[0], reason: decoded[1] };
    } catch (e) {
        console.error("deserializeResponseData failed: ", e);
        return null;
    }
}

export function serializeRejectData(data: RejectData): Uint8Array {
    return msgpack.encode([data.reason]);
}

export function deserializeRejectData(data: Uint8Array): RejectData | null {
    try {
        const decoded = msgpack.decode(data) as [number];
        return { reason: decoded[0] };
    } catch (e) {
        console.error("deserializeRejectData failed.", e);
        return null;
    }
}

export function serializeNextData(data: NextData): Uint8Array {
    return msgpack.encode([data.position]);
}

export function deserializeNextData(data: Uint8Array): NextData | null {
    try {
        const decoded = msgpack.decode(data) as [number];
        return { position: decoded[0] };
    } catch (e) {
        console.error("deserializeNextData failed.", e);
        return null;
    }
}

export function serializeCancelData(data: CancelData): Uint8Array {
    return msgpack.encode([data.reason]);
}

export function deserializeCancelData(data: Uint8Array): CancelData | null {
    try {
        const decoded = msgpack.decode(data) as [number];
        return { reason: decoded[0] };
    } catch (e) {
        console.error("deserializeCancelData failed.", e);
        return null;
    }
}

export function serializeChunkData(data: ChunkData): Uint8Array {
    return msgpack.encode([data.position, data.data]);
}

export function deserializeChunkData(data: Uint8Array): ChunkData | null {
    try {
        const decoded = msgpack.decode(data) as [number, Uint8Array];
        return { position: decoded[0], data: decoded[1] };
    } catch (e) {
        console.error("deserializeChunkData failed.", e);
        return null;
    }
}

export function serializeResultData(data: ResultData): Uint8Array {
    return msgpack.encode([data.result]);
}
export function deserializeResultData(data: Uint8Array): ResultData | null {
    try {
        const decoded = msgpack.decode(data) as [number];
        return { result: decoded[0] };
    } catch (e) {
        console.error("deserializeResultData failed.", e);
        return null;
    }
}

export function serializeCommandAck(statusCode: number): Uint8Array {
    return msgpack.encode([statusCode]);
}
export function deserializeCommandAck(data: Uint8Array): CommandAck | null {
    try {
        const decoded = msgpack.decode(data) as [number];
        return { statusCode: decoded[0] };
    } catch (e) {
        console.error("deserializeCommandAck failed.", e);
        return null;
    }
}

export function serializeCRCPacket<T>(data: T, serializeFunc: (data: T) => Uint8Array): Uint8Array {
    const serializedData = serializeFunc(data);
    const crc = calculateCRC32(serializedData);
    const crcBytes = new Uint8Array(new Uint32Array([crc]).buffer);
    return new Uint8Array([...crcBytes, ...serializedData]);
}

export function deserializeCRCPacket<T>(
    data: Uint8Array,
    deserializeFunc: (data: Uint8Array) => T | null
): { crc: number; data: T } | null {
    try {
        const receivedCrc = new Uint32Array(data.slice(0, 4).buffer)[0];
        const serializedData = data.slice(4);
        const calculatedCrc = calculateCRC32(serializedData);

        if (receivedCrc !== calculatedCrc) {
            console.error(`CRC mismatch: expected ${calculatedCrc}, got ${receivedCrc}`);
            return null;
        }

        const deserializedData = deserializeFunc(serializedData);
        if (!deserializedData) {
            return null;
        }

        return { crc: receivedCrc, data: deserializedData };
    }
    catch (e) {
        console.error("deserializeCRCPacket failed.", e);
        return null;
    }
}