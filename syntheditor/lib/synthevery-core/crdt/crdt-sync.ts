import { Mesh } from '../connection/mesh';
import { CommandDispatcher } from '../command/dispatcher';
import { P2PMacAddress } from '../types/mesh';
import { CommandID } from '../types/command';
import { CRDTSequenceClient } from '../command/crdt-sequence-client';
import { CRDTAuditClient } from '../command/crdt-audit-client';
import { CRDTFullStateClient } from '../command/crdt-full-state';
import { CRDTNote, NoteID } from '../../crdt/types';
import { COMMAND_CLIENT_ID_CRDT_FULL_STATE, COMMAND_CLIENT_ID_CRDT_HASH_AUDIT, COMMAND_CLIENT_ID_CRDT_SEQUENCE } from '../command/constants';

export class CRDTSyncManager {
    private mesh: Mesh;
    private dispatcher: CommandDispatcher;

    // per peer clients
    private seqClients = new Map<string, CRDTSequenceClient>();
    private auditClients = new Map<string, CRDTAuditClient>();
    private fullClients = new Map<string, CRDTFullStateClient>();

    // dynamic handlers (can be updated after construction)
    private handlerOnAdd: (peer: P2PMacAddress, track: number, note: CRDTNote) => void = () => { };
    private handlerOnRemove: (peer: P2PMacAddress, track: number, id: NoteID) => void = () => { };
    private handlerGetAuditPayload: () => Uint8Array = () => new Uint8Array();
    private handlerOnReceiveAudit: (peer: P2PMacAddress, data: Uint8Array) => void = () => { };
    private handlerGetFullState: () => CRDTNote[] = () => [];
    private handlerOnReceiveFull: (peer: P2PMacAddress, notes: CRDTNote[]) => void = () => { };
    // multi-track full-sync handlers
    private handlerGetFullStateMulti: () => { adds: CRDTNote[]; removes: NoteID[]; }[] = () => [];
    private handlerOnReceiveFullMulti: (peer: P2PMacAddress, tracks: { track: number; adds: CRDTNote[]; removes: NoteID[]; }[]) => void = () => { };

    constructor(
        mesh: Mesh,
        dispatcher: CommandDispatcher,
        hooks: Partial<CRDTSyncHandlers>
    ) {
        this.mesh = mesh;
        this.dispatcher = dispatcher;
        this.setHandlers(hooks);

        this.mesh.eventEmitter.on('connectedDevicesChanged', (connected: P2PMacAddress[], added: P2PMacAddress[], removed: P2PMacAddress[]) => {
            for (const peer of added) this.initializeNode(peer);
        });
        // Also register for direct BLE peer connections so command handler exists for incoming packets
        this.mesh.eventEmitter.on('peerConnected', (peer: P2PMacAddress) => {
            this.initializeNode(peer);
        });
    }

    private key(peer: P2PMacAddress): string {
        return Array.from(peer.address).join(':');
    }

    private initializeNode(peer: P2PMacAddress): void {
        const handler = this.dispatcher.getCommandHandler(peer, true);
        if (!handler) return;

        const k = this.key(peer);

        if (!handler.hasClientInterface(COMMAND_CLIENT_ID_CRDT_SEQUENCE)) {
            const c = new CRDTSequenceClient(peer, (p, t, n) => this.handlerOnAdd(p, t, n), (p, t, id) => this.handlerOnRemove(p, t, id));
            handler.setClientInterface(c);
            this.seqClients.set(k, c);
        }
        if (!handler.hasClientInterface(COMMAND_CLIENT_ID_CRDT_HASH_AUDIT)) {
            const c = new CRDTAuditClient(peer, () => this.handlerGetAuditPayload(), (p, data) => this.handlerOnReceiveAudit(p, data));
            handler.setClientInterface(c);
            this.auditClients.set(k, c);
        }
        if (!handler.hasClientInterface(COMMAND_CLIENT_ID_CRDT_FULL_STATE)) {
            const c = new CRDTFullStateClient(peer, () => this.handlerGetFullState(), (p, notes) => this.handlerOnReceiveFull(p, notes));
            handler.setClientInterface(c);
            this.fullClients.set(k, c);
        }
    }

    private static readonly CRDT_SHARE_SEND_MASK: boolean[] = [true, true, true, true, true, true, true, true];
    private static readonly CRDT_SHARE_RECV_MASK: boolean[] = [true, true, true, true, true, true, true, true];
    private static readonly CRDT_AUDIT_ENABLED: boolean = true;

    broadcastAdd(track: number, note: CRDTNote): void {
        if (!CRDTSyncManager.CRDT_SHARE_SEND_MASK[track >>> 0]) return;
        for (const [k, client] of this.seqClients.entries()) {
            const parts = k.split(':').map(x => parseInt(x, 10));
            const peer: P2PMacAddress = { address: new Uint8Array(parts) };
            const handler = this.dispatcher.getCommandHandler(peer, false);
            if (!handler) continue;
            const out: CommandID = { client_id: COMMAND_CLIENT_ID_CRDT_SEQUENCE, type: 0 };
            if (client.prepareAdd(out, track, note)) handler.pushCommand(out);
        }
    }

    broadcastRemove(track: number, id: NoteID): void {
        if (!CRDTSyncManager.CRDT_SHARE_SEND_MASK[track >>> 0]) return;
        for (const [k, client] of this.seqClients.entries()) {
            const parts = k.split(':').map(x => parseInt(x, 10));
            const peer: P2PMacAddress = { address: new Uint8Array(parts) };
            const handler = this.dispatcher.getCommandHandler(peer, false);
            if (!handler) continue;
            const out: CommandID = { client_id: COMMAND_CLIENT_ID_CRDT_SEQUENCE, type: 0 };
            if (client.prepareRemove(out, track, id)) handler.pushCommand(out);
        }
    }
}

export type CRDTSyncHandlers = {
    onAdd: (peer: P2PMacAddress, track: number, note: CRDTNote) => void,
    onRemove: (peer: P2PMacAddress, track: number, id: NoteID) => void,
    getAuditPayload: () => Uint8Array,
    onReceiveAudit: (peer: P2PMacAddress, data: Uint8Array) => void,
    getFullState: () => CRDTNote[],
    onReceiveFull: (peer: P2PMacAddress, notes: CRDTNote[]) => void,
    getFullStateMulti?: () => { adds: CRDTNote[]; removes: NoteID[]; }[],
    onReceiveFullMulti?: (peer: P2PMacAddress, tracks: { track: number; adds: CRDTNote[]; removes: NoteID[]; }[]) => void,
};

export interface CRDTSyncManager {
    setHandlers(h: Partial<CRDTSyncHandlers>): void;
}

// augment class with setter implementation
(CRDTSyncManager as any).prototype.setHandlers = function (this: CRDTSyncManager & any, h: Partial<CRDTSyncHandlers>) {
    if (h.onAdd) this.handlerOnAdd = h.onAdd;
    if (h.onRemove) this.handlerOnRemove = h.onRemove;
    if (h.getAuditPayload) this.handlerGetAuditPayload = h.getAuditPayload;
    if (h.onReceiveAudit) this.handlerOnReceiveAudit = h.onReceiveAudit;
    if (h.getFullState) this.handlerGetFullState = h.getFullState;
    if (h.onReceiveFull) this.handlerOnReceiveFull = h.onReceiveFull;
    if (h.getFullStateMulti) this.handlerGetFullStateMulti = h.getFullStateMulti;
    if (h.onReceiveFullMulti) this.handlerOnReceiveFullMulti = h.onReceiveFullMulti;
};


