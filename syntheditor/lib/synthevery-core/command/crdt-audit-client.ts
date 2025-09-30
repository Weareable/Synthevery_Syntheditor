import { PayloadCommandClient } from './payload-command-client';
import { COMMAND_CLIENT_ID_CRDT_HASH_AUDIT } from './constants';
import { CommandID } from '../types/command';
import { P2PMacAddress } from '../types/mesh';
import { NoteOrSet } from '../../crdt/orset';

export class CRDTAuditClient extends PayloadCommandClient {
    private peer: P2PMacAddress;
    private getAuditPayload: () => Uint8Array;
    private onReceiveAudit: (peer: P2PMacAddress, data: Uint8Array) => void;

    constructor(
        peer: P2PMacAddress,
        getAuditPayload: () => Uint8Array,
        onReceiveAudit: (peer: P2PMacAddress, data: Uint8Array) => void
    ) {
        super(COMMAND_CLIENT_ID_CRDT_HASH_AUDIT);
        this.peer = peer;
        this.getAuditPayload = getAuditPayload;
        this.onReceiveAudit = onReceiveAudit;
    }

    prepareAudit(out: CommandID): boolean {
        const payload = this.getAuditPayload();
        return this.allocateAndPrepare(out, payload);
    }

    protected onHandleData(id: CommandID, data: Uint8Array): [boolean, Uint8Array] {
        // 監査: type=0 はリーダーからの要求。addXor32, removeXor32 (LE) を応答する
        if ((id.type >>> 0) === 0x00) {
            const payload = this.getAuditPayload();
            // デバイス互換: 8B (uint32 LE * 2)
            return [true, payload instanceof Uint8Array ? payload : new Uint8Array()];
        }
        // それ以外は相手からの応答として扱い、上位へ通知
        console.log('[CRDT][recv][audit]', {
            from: this.peer,
            size: data?.byteLength ?? 0
        });
        this.onReceiveAudit(this.peer, data);
        return [true, new Uint8Array()];
    }
}


