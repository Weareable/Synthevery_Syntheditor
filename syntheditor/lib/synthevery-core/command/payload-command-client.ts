import { CommandClientInterface } from './handler';
import { CommandID } from '../types/command';

export class PayloadCommandClient implements CommandClientInterface {
    private clientId: number;
    private waitTimeoutMs: number;
    private payloadSlots: Map<number, Uint8Array> = new Map();
    private inUse: Set<number> = new Set();
    private nextSession: number = 0;

    constructor(clientId: number, waitTimeoutMs: number = 0) {
        this.clientId = clientId;
        this.waitTimeoutMs = waitTimeoutMs;
    }

    allocateAndPrepare(outCmd: CommandID, data: Uint8Array): boolean {
        const session = this.tryAllocate();
        if (session === null) {
            return false;
        }
        const copy = new Uint8Array(data.length);
        copy.set(data);
        this.payloadSlots.set(session, copy);
        outCmd.client_id = this.clientId;
        outCmd.type = session;
        return true;
    }

    cancel(sessionId: number): boolean {
        if (!this.inUse.has(sessionId)) {
            return false;
        }
        this.clearSlot(sessionId);
        return true;
    }

    generateData(id: CommandID): Uint8Array {
        const session = id.type & 0xff;
        if (!this.inUse.has(session)) {
            // waitTimeoutMs は現状未実装（即時無効データ）
            return new Uint8Array();
        }
        const payload = this.payloadSlots.get(session);
        if (!payload) {
            return new Uint8Array();
        }
        return this.onBeforeGenerate(id, payload);
    }

    handleData(id: CommandID, data: Uint8Array): [boolean, Uint8Array] {
        return this.onHandleData(id, data);
    }

    handleAck(id: CommandID, data: Uint8Array): boolean {
        return this.onHandleAck(id, data);
    }

    onComplete(id: CommandID): void {
        const session = id.type & 0xff;
        if (this.inUse.has(session)) {
            this.clearSlot(session);
        }
        this.onAfterComplete(id);
    }

    onTimeout(id: CommandID): void {
        const session = id.type & 0xff;
        if (this.inUse.has(session)) {
            this.clearSlot(session);
        }
        this.onAfterTimeout(id);
    }

    getClientID(): number {
        return this.clientId;
    }

    protected onBeforeGenerate(id: CommandID, payload: Uint8Array): Uint8Array {
        return payload;
    }

    protected onHandleAck(id: CommandID, _data: Uint8Array): boolean {
        return true;
    }

    protected onHandleData(id: CommandID, _data: Uint8Array): [boolean, Uint8Array] {
        return [true, new Uint8Array()];
    }

    protected onAfterComplete(_id: CommandID): void { }
    protected onAfterTimeout(_id: CommandID): void { }

    protected allocateSession(_inUse: Set<number>, nextStart: number): number | null {
        for (let i = 0; i < 256; i++) {
            const idx = (nextStart + i) & 0xff;
            if (!this.inUse.has(idx)) {
                return idx;
            }
        }
        return null;
    }

    private tryAllocate(): number | null {
        const session = this.allocateSession(this.inUse, this.nextSession);
        if (session === null) {
            return null;
        }
        this.inUse.add(session);
        this.nextSession = (session + 1) & 0xff;
        return session;
    }

    private clearSlot(sessionId: number): void {
        this.inUse.delete(sessionId);
        this.payloadSlots.delete(sessionId);
    }
}


