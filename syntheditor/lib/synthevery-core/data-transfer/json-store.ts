import { SenderDataStoreInterface, ReceiverDataStoreInterface } from "./interfaces";
import { EventEmitter } from "eventemitter3";

export class JsonSenderDataStore implements SenderDataStoreInterface {
    private data: Uint8Array;
    private dataType: number;
    private metaData: string;

    constructor(value: any, dataType: number, metaData: string) {
        const jsonString = JSON.stringify(value);
        this.data = new Uint8Array(jsonString.length);
        this.data.set(new TextEncoder().encode(jsonString));
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
    received: (json: any) => void;
}

export class JsonReceiverDataStore implements ReceiverDataStoreInterface {
    private data: Uint8Array;
    private capacity: number;
    readonly eventEmitter = new EventEmitter<JsonReceiverDataStoreEvents>();

    constructor(capacity: number) {
        this.data = new Uint8Array(capacity);
        this.capacity = capacity;
    }

    write(data: Uint8Array, offset: number): void {
        this.data.set(data, offset);
        if (offset + data.length >= this.capacity) {
            try {
                const jsonString = new TextDecoder().decode(this.data);
                const json = JSON.parse(jsonString);
                this.eventEmitter.emit('received', json);
            } catch (error) {
                console.error(error);
            }
        }
    }

    size(): number {
        return this.data.length;
    }
}