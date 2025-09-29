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
        // 受信ログ（ハッシュ監査）
        console.log('[CRDT][recv][audit]', {
            from: this.peer,
            size: data?.byteLength ?? 0
        });
        this.onReceiveAudit(this.peer, data);
        return [true, new Uint8Array()];
    }
}


