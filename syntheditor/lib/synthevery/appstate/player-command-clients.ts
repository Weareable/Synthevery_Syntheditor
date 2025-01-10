import { CommandID, CommandResult } from '@/types/command';
import { CommandClientInterface } from '@/lib/synthevery/connection/command-handler';
import { P2PMacAddress } from '@/types/mesh';
import { serializeBoolean, serializeFloat32 } from './appstates';

export class PlayerCommandClient implements CommandClientInterface {

    static readonly COMMAND_TYPE_PLAYING_STATE = 0x00;
    static readonly COMMAND_TYPE_BPM = 0x01;

    static readonly PLAYING_STATE_PAUSE = 0x00;
    static readonly PLAYING_STATE_PLAY = 0x01;
    static readonly PLAYING_STATE_STOP = 0x02;

    static readonly COMMAND_TYPE_PLAYING_STATE_SIZE = 1;
    static readonly COMMAND_TYPE_BPM_SIZE = 4;

    private clientId: number;
    private targetPlayingState: React.MutableRefObject<boolean>;
    private targetBpm: React.MutableRefObject<number>;

    constructor(clientId: number, targetPlayingState: React.MutableRefObject<boolean>, targetBpm: React.MutableRefObject<number>) {
        this.clientId = clientId;
        this.targetPlayingState = targetPlayingState;
        this.targetBpm = targetBpm;
    }

    generateData(commandId: CommandID): Uint8Array {
        switch (commandId.type) {
            case PlayerCommandClient.COMMAND_TYPE_PLAYING_STATE:
                return serializeBoolean(this.targetPlayingState.current);
            case PlayerCommandClient.COMMAND_TYPE_BPM:
                return serializeFloat32(this.targetBpm.current);
        }

        return new Uint8Array();
    }

    handleData(commandId: CommandID, data: Uint8Array): [boolean, Uint8Array] {
        return [true, new Uint8Array()];
    }

    handleAck(commandId: CommandID, data: Uint8Array): boolean {
        return true;
    }

    onComplete(commandId: CommandID): void {
        return;
    }

    onTimeout(commandId: CommandID): void {
        return;
    }

    getClientID(): number {
        return this.clientId;
    }
}

