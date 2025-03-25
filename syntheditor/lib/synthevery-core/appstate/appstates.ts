import { AppStateID, AppStateStoreInterface, AppStateSyncInterface, AppStateSyncEvents } from '../types/appstate';
import { encode, decode } from '@msgpack/msgpack';
import { P2PMacAddress } from '../types/mesh';
import EventEmitter from 'eventemitter3';
import { useRef } from 'react';
import { getAddressFromString, getAddressString } from '../connection/util';

// MsgPack シリアライズ関数
export function serializeMsgPack<T>(value: T): Uint8Array {
    return encode(value);
}

// MsgPack デシリアライズ関数
export function deserializeMsgPack<T>(data: Uint8Array): T | null {
    try {
        return decode(data) as T;
    } catch (error) {
        console.error('Failed to deserialize MsgPack:', error);
        return null;
    }
}

// プリミティブ型のシリアライズ関数
export function serializeBoolean(value: boolean): Uint8Array {
    return new Uint8Array([value ? 1 : 0]);
}

// プリミティブ型のデシリアライズ関数
export function deserializeBoolean(data: Uint8Array): boolean | null {
    if (data.byteLength < 1) {
        console.error('Failed to deserialize: Data is too short, needed=1 byte, got=', data.byteLength, 'bytes');
        return null;
    }
    return data[0] !== 0;
}

export function serializeFloat32(value: number): Uint8Array {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, value, true);
    return new Uint8Array(buffer);
}

export function deserializeFloat32(data: Uint8Array): number | null {
    if (data.byteLength < 4) {
        console.error('Failed to deserialize: Data length is too short, needed=4 bytes, got=', data.byteLength, 'bytes');
        return null;
    }
    return new DataView(data.buffer).getFloat32(0, true);
}

export function serializeUint32(value: number): Uint8Array {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, value, true);
    return new Uint8Array(buffer);
}

export function deserializeUint32(data: Uint8Array): number | null {
    if (data.byteLength < 4) {
        console.error('Failed to deserialize: Data length is too short, needed=4 bytes, got=', data.byteLength, 'bytes');
        return null;
    }
    return new DataView(data.buffer).getUint32(0, true);
}

export function serializeUint8(value: number): Uint8Array {
    return new Uint8Array([value]);
}

export function deserializeUint8(data: Uint8Array): number | null {
    return data[0];
}

export function serializeFixedUint8Array(value: Uint8Array): Uint8Array {
    return new Uint8Array(value);
}

export function deserializeFixedUint8Array(data: Uint8Array): Uint8Array | null {
    return new Uint8Array(data);
}

export function serializeP2PMacAddress(value: P2PMacAddress): Uint8Array {
    return new Uint8Array(value.address);
}

export function deserializeP2PMacAddress(data: Uint8Array): P2PMacAddress | null {
    if (data.byteLength !== 6) {
        console.error('Failed to deserialize: Data length is not 6');
        return null;
    }
    const address = new Uint8Array(data);
    return { address };
}

export function serializeStringP2PMacAddress(value: string): Uint8Array {
    const address = getAddressFromString(value);
    return serializeP2PMacAddress(address);
}

export function deserializeStringP2PMacAddress(data: Uint8Array): string | null {
    const address = deserializeP2PMacAddress(data);
    if (address === null) {
        console.error('Failed to deserialize: Data is not a valid P2PMacAddress');
        return null;
    }
    return getAddressString(address);
}

// DataViewから値を読み込むヘルパー関数
function readValueFromDataView(
    view: DataView,
    type: 'number' | 'string' | 'boolean',
    offset: number
): number | string | boolean {
    if (type === 'number') {
        return view.getFloat64(offset);
    } else if (type === 'string') {
        return String.fromCharCode(view.getUint16(offset));
    } else if (type === 'boolean') {
        return view.getUint8(offset) !== 0;
    } else {
        throw new Error('Unsupported primitive type');
    }
}

type Serializer<T> = (value: T) => Uint8Array;
type Deserializer<T> = (data: Uint8Array) => T | null;

export function serializeArrayFixedLength<T>(
    value: T[],
    serializer: Serializer<T>,
    elementLength: number
): Uint8Array {
    const result = new Uint8Array(elementLength * value.length);
    let offset = 0;
    for (const item of value) {
        const serializedItem = serializer(item);
        if (serializedItem.byteLength !== elementLength) {
            throw new Error(
                `Serialized item length does not match expected length: expected ${elementLength}, got ${serializedItem.byteLength}`
            );
        }
        result.set(serializedItem, offset);
        offset += elementLength;
    }
    return result;
}

export function deserializeArrayFixedLength<T>(
    data: Uint8Array,
    deserializer: Deserializer<T>,
    elementLength: number
): T[] | null {
    if (data.byteLength % elementLength !== 0) {
        console.error(
            'Failed to deserialize: Data length is not a multiple of element length'
        );
        return null;
    }
    let offset = 0;
    const newArray: T[] = [];
    while (offset < data.byteLength) {
        const itemData = data.slice(offset, offset + elementLength);
        const deserializationResult = deserializer(itemData);
        if (deserializationResult === null) {
            console.error(
                'Failed to deserialize item:',
                itemData
            );
            return null;
        }
        newArray.push(deserializationResult);
        offset += elementLength;
    }
    return newArray;
}


export function serializeMap<K, V>(
    value: Map<K, V>,
    keySerializer: Serializer<K>,
    valueSerializer: Serializer<V>,
    keyLength: number,
    valueLength: number
): Uint8Array {
    const result = new Uint8Array(
        (keyLength + valueLength) * value.size
    );
    let offset = 0;
    for (const [key, val] of value) {
        const serializedKey = keySerializer(key);
        if (serializedKey.byteLength !== keyLength) {
            throw new Error(
                `Serialized key length does not match expected length: expected ${keyLength}, got ${serializedKey.byteLength}`
            );
        }
        const serializedValue = valueSerializer(val);
        if (serializedValue.byteLength !== valueLength) {
            throw new Error(
                `Serialized value length does not match expected length: expected ${valueLength}, got ${serializedValue.byteLength}`
            );
        }
        result.set(serializedKey, offset);
        offset += keyLength;
        result.set(serializedValue, offset);
        offset += valueLength;
    }
    return result;
}

export function deserializeMap<K, V>(
    data: Uint8Array,
    keyDeserializer: Deserializer<K>,
    valueDeserializer: Deserializer<V>,
    keyLength: number,
    valueLength: number
): Map<K, V> | null {
    if (data.byteLength % (keyLength + valueLength) !== 0) {
        console.error(
            'Failed to deserialize: Data length is not a multiple of key length + value length'
        );
        return null;
    }
    let offset = 0;
    const newMap = new Map<K, V>();
    while (offset < data.byteLength) {
        const keyData = data.slice(offset, offset + keyLength);
        const keyDeserializationResult = keyDeserializer(keyData);
        if (keyDeserializationResult === null) {
            console.error(
                'Failed to deserialize key:',
                keyData
            );
            return null;
        }
        offset += keyLength;
        const valueData = data.slice(offset, offset + valueLength);
        const valueDeserializationResult = valueDeserializer(valueData);
        if (valueDeserializationResult === null) {
            console.error(
                'Failed to deserialize value:',
                valueData
            );
            return null;
        }
        offset += valueLength;
        newMap.set(keyDeserializationResult, valueDeserializationResult);
    }
    return newMap;
}

export class AppStateStore<T> implements AppStateStoreInterface {
    value: T;
    private serializer: Serializer<T>;
    private deserializer: Deserializer<T>;

    constructor(value: T, serializer: Serializer<T>, deserializer: Deserializer<T>) {
        this.value = value;
        this.serializer = serializer;
        this.deserializer = deserializer;
    }

    serialize(): Uint8Array {
        return this.serializer(this.value);
    }

    deserialize(data: Uint8Array): boolean {
        const deserializedValue = this.deserializer(data);
        if (deserializedValue === null) {
            return false;
        }
        this.value = deserializedValue;
        return true;
    }
}

export class SyncState<T> implements AppStateSyncInterface {
    private id: AppStateID;
    private store: AppStateStore<T>;

    eventEmitter: EventEmitter<AppStateSyncEvents>;

    constructor(id: AppStateID, store: AppStateStore<T>) {
        this.id = id;
        this.store = store;
        this.eventEmitter = new EventEmitter<AppStateSyncEvents>();
    }

    getID(): AppStateID {
        return this.id;
    }

    getStore(): AppStateStore<T> {
        return this.store;
    }

    notifyChange(): void {
        this.eventEmitter.emit('notify');
    }
}

export class ReadOnlySyncState<T> implements AppStateSyncInterface {
    private id: AppStateID;
    private store: AppStateStore<T>;

    eventEmitter: EventEmitter<AppStateSyncEvents>;

    constructor(id: AppStateID, store: AppStateStore<T>) {
        this.id = id;
        this.store = store;
        this.eventEmitter = new EventEmitter<AppStateSyncEvents>();
    }

    getID(): AppStateID {
        return this.id;
    }

    getStore(): AppStateStore<T> {
        return this.store;
    }

    notifyChange(): void { }
}
