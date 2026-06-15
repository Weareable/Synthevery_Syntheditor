import { SenderDataStoreInterface, ReceiverDataStoreInterface } from "./interfaces";
import { EventEmitter } from "eventemitter3";
import { P2PMacAddress } from "../types/mesh";

export class JsonSenderDataStore implements SenderDataStoreInterface {
    private data: Uint8Array;
    private dataType: number;
    private metaData: string;

    constructor(value: any, dataType: number, metaData: string) {
        const jsonString = JSON.stringify(value);
        const encoded = new TextEncoder().encode(jsonString);
        // IMPORTANT: allocate by encoded byte length (not string length)
        // to avoid truncation of multi-byte UTF-8
        this.data = new Uint8Array(encoded.length);
        this.data.set(encoded);
        this.dataType = dataType;
        this.metaData = metaData;
    }

    size(): number {
        return this.data.length;
    }

    type(): number {
        return this.dataType;
    }

    metadata(): string {
        return this.metaData;
    }

    get(offset: number, size: number): Uint8Array {
        return this.data.slice(offset, offset + size);
    }
}

interface JsonReceiverDataStoreEvents {
    received: (json: any, sender: P2PMacAddress) => void;
}

export class JsonReceiverDataStore implements ReceiverDataStoreInterface {
    private data: Uint8Array;
    private capacity: number;
    private sender: P2PMacAddress;
    readonly eventEmitter = new EventEmitter<JsonReceiverDataStoreEvents>();

    constructor(capacity: number, sender: P2PMacAddress) {
        this.data = new Uint8Array(capacity);
        this.capacity = capacity;
        this.sender = sender;
    }

    write(data: Uint8Array, offset: number): void {
        this.data.set(data, offset);
        if (offset + data.length >= this.capacity) {
            try {
                const jsonString = new TextDecoder().decode(this.data);
                const json = JSON.parse(jsonString);
                this.eventEmitter.emit('received', json, this.sender);
            } catch (error) {
                console.error(error);
            }
        }
    }

    size(): number {
        return this.data.length;
    }
}