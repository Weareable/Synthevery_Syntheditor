import { PayloadCommandClient } from './payload-command-client';
import { COMMAND_CLIENT_ID_CRDT_FULL_STATE } from './constants';
import { CommandID } from '../types/command';
import { CRDTNote } from '../../crdt/types';
import { packNotes, unpackNotes } from '../../crdt/msgpack';
import { P2PMacAddress } from '../types/mesh';

export class CRDTFullStateClient extends PayloadCommandClient {
    private peer: P2PMacAddress;
    private getFullState: () => CRDTNote[];
    private onReceiveFullState: (peer: P2PMacAddress, notes: CRDTNote[]) => void;

    constructor(
        peer: P2PMacAddress,
        getFullState: () => CRDTNote[],
        onReceiveFullState: (peer: P2PMacAddress, notes: CRDTNote[]) => void
    ) {
        super(COMMAND_CLIENT_ID_CRDT_FULL_STATE);
        this.peer = peer;
        this.getFullState = getFullState;
        this.onReceiveFullState = onReceiveFullState;
    }

    prepareSend(out: CommandID): boolean {
        const payload = packNotes(this.getFullState());
        return this.allocateAndPrepare(out, payload);
    }

    protected onHandleData(id: CommandID, data: Uint8Array): [boolean, Uint8Array] {
        try {
            console.log('[CRDT][recv][full-state][cmd]', {
                from: this.peer,
                size: data?.byteLength ?? 0
            });
            const notes = unpackNotes(data);
            this.onReceiveFullState(this.peer, notes);
            // simple ACK: empty
            return [true, new Uint8Array()];
        } catch (e) {
            console.warn('[CRDT][recv][full-state][cmd][error]', e);
            return [false, new Uint8Array()];
        }
    }
}



