import { CommandClientInterface } from "../command/handler";
import { CommandID } from "../types/command";
import { COMMAND_CLIENT_ID_PLAYER_CONTROL } from "../command/constants";
import { playerSyncStates } from "./states";
import { mesh } from "../connection/mesh";
import { P2PMacAddress } from "../types/mesh";
import { commandDispatcher } from "../command/dispatcher";
import { serializeBoolean, serializeFloat32 } from "../appstate/appstates";

class PlayerCommandClient implements CommandClientInterface {
    static readonly COMMAND_TYPE_PLAYING_STATE = 0x00;
    static readonly COMMAND_TYPE_BPM = 0x01;
    static readonly COMMAND_TYPE_STOP = 0x02;

    static readonly COMMAND_TYPE_PLAYING_STATE_SIZE = 1;
    static readonly COMMAND_TYPE_BPM_SIZE = 4;

    generateData(commandId: CommandID): Uint8Array {
        switch (commandId.type) {
            case PlayerCommandClient.COMMAND_TYPE_PLAYING_STATE:
                return serializeBoolean(playerSyncStates.metronomeState.getStore().value);
            case PlayerCommandClient.COMMAND_TYPE_BPM:
                return serializeFloat32(playerSyncStates.tickClockState.getStore().value.bpm);
            case PlayerCommandClient.COMMAND_TYPE_STOP:
                return new Uint8Array();
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
        return COMMAND_CLIENT_ID_PLAYER_CONTROL;
    }
}

class PlayerController {
    constructor() {
        mesh.eventEmitter.on('connectedDevicesChanged', (connectedDevices: P2PMacAddress[]) => {
            for (const device of connectedDevices) {
                this.initializeNode(device);
            }
        });
    }

    setPlayingState(state: "play" | "pause" | "stop"): void {
        switch (state) {
            case "play":
                playerSyncStates.metronomeState.getStore().value = true;
                this.sendCommand({
                    client_id: COMMAND_CLIENT_ID_PLAYER_CONTROL,
                    type: PlayerCommandClient.COMMAND_TYPE_PLAYING_STATE,
                });
                break;
            case "pause":
                playerSyncStates.metronomeState.getStore().value = false;
                this.sendCommand({
                    client_id: COMMAND_CLIENT_ID_PLAYER_CONTROL,
                    type: PlayerCommandClient.COMMAND_TYPE_PLAYING_STATE,
                });
                break;
            case "stop":
                playerSyncStates.metronomeState.getStore().value = false;
                this.sendCommand({
                    client_id: COMMAND_CLIENT_ID_PLAYER_CONTROL,
                    type: PlayerCommandClient.COMMAND_TYPE_STOP,
                });
                break;
            default:
                console.warn("setPlayingState() : invalid state");
                break;
        }
    }

    setBpm(bpm: number): void {
        if (bpm < 10 || bpm > 500) {
            console.warn("setBpm() : invalid bpm, must be between 10 ~ 500");
            return;
        }
        playerSyncStates.tickClockState.getStore().value.bpm = bpm;
        this.sendCommand({
            client_id: COMMAND_CLIENT_ID_PLAYER_CONTROL,
            type: PlayerCommandClient.COMMAND_TYPE_BPM,
        });
    }

    private initializeNode(address: P2PMacAddress): void {
        const handler = commandDispatcher.getCommandHandler(address, true);
        if (!handler) {
            console.warn("initializeNode() : handler could not be created");
            return;
        }

        if (handler.hasClientInterface(COMMAND_CLIENT_ID_PLAYER_CONTROL)) {
            console.warn("initializeNode() : client interface already exists");
            return;
        }

        handler.setClientInterface(new PlayerCommandClient());
    }

    sendCommand(commandId: CommandID): void {
        if (mesh.getConnectedPeers().length === 0) {
            console.warn("sendCommand() : no connected peers");
            return;
        }

        const handler = commandDispatcher.getCommandHandler(mesh.getConnectedPeers()[0], false);
        if (!handler) {
            console.warn("sendCommand() : handler unavailable");
            return;
        }

        handler.pushCommand(commandId);
    }
}

export const playerController = new PlayerController();
