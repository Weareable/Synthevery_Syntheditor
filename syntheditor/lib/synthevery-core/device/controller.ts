import { CommandClientInterface } from "../command/handler";
import { CommandID } from "../types/command";
import { COMMAND_CLIENT_ID_DEVICE_CONTROL } from "../command/constants";
import { playerSyncStates } from "../player/states";
import { mesh } from "../connection/mesh";
import { P2PMacAddress } from "../types/mesh";
import { commandDispatcher } from "../command/dispatcher";
import { serializeBoolean, serializeFloat32 } from "../appstate/appstates";

class DeviceCommandClient implements CommandClientInterface {
    static readonly COMMAND_TYPE_PLAYING_STATE = 0x00;
    static readonly COMMAND_TYPE_BPM = 0x01;
    static readonly COMMAND_TYPE_STOP = 0x02;
    static readonly COMMAND_TYPE_REQUEST_NOTE_BUILDER_CONFIG = 0x10;
    static readonly COMMAND_TYPE_REQUEST_GENERATOR_CONFIG = 0x11;
    static readonly COMMAND_TYPE_REQUEST_TRACK_DETAIL = 0x12;
    static readonly COMMAND_TYPE_REQUEST_BODY_COLOR_CONFIG = 0x13;
    static readonly COMMAND_TYPE_REQUEST_LED_COLOR_CONFIG = 0x14;
    static readonly COMMAND_TYPE_REQUEST_SETTINGS_CONFIG = 0x15;

    static readonly COMMAND_TYPE_PLAYING_STATE_SIZE = 1;
    static readonly COMMAND_TYPE_BPM_SIZE = 4;

    generateData(commandId: CommandID): Uint8Array {
        switch (commandId.type) {
            case DeviceCommandClient.COMMAND_TYPE_PLAYING_STATE:
                return serializeBoolean(playerSyncStates.metronomeState.getStore().value);
            case DeviceCommandClient.COMMAND_TYPE_BPM:
                return serializeFloat32(playerSyncStates.tickClockState.getStore().value.bpm);
            case DeviceCommandClient.COMMAND_TYPE_STOP:
                return new Uint8Array();
            case DeviceCommandClient.COMMAND_TYPE_REQUEST_NOTE_BUILDER_CONFIG:
                return new Uint8Array();
            case DeviceCommandClient.COMMAND_TYPE_REQUEST_GENERATOR_CONFIG:
                return new Uint8Array();
            case DeviceCommandClient.COMMAND_TYPE_REQUEST_TRACK_DETAIL:
                return new Uint8Array();
            case DeviceCommandClient.COMMAND_TYPE_REQUEST_BODY_COLOR_CONFIG:
                return new Uint8Array();
            case DeviceCommandClient.COMMAND_TYPE_REQUEST_LED_COLOR_CONFIG:
                return new Uint8Array();
            case DeviceCommandClient.COMMAND_TYPE_REQUEST_SETTINGS_CONFIG:
                return new Uint8Array();
        }

        return new Uint8Array();
    }

    handleData(commandId: CommandID, data: Uint8Array): [boolean, Uint8Array] {
        switch (commandId.type) {
            case DeviceCommandClient.COMMAND_TYPE_PLAYING_STATE:
                return [true, new Uint8Array()];
            case DeviceCommandClient.COMMAND_TYPE_BPM:
                return [true, new Uint8Array()];
            case DeviceCommandClient.COMMAND_TYPE_STOP:
                return [true, new Uint8Array()];
            case DeviceCommandClient.COMMAND_TYPE_REQUEST_NOTE_BUILDER_CONFIG:
                return [true, new Uint8Array()];
            case DeviceCommandClient.COMMAND_TYPE_REQUEST_GENERATOR_CONFIG:
                return [true, new Uint8Array()];
            case DeviceCommandClient.COMMAND_TYPE_REQUEST_TRACK_DETAIL:
                return [true, new Uint8Array()];
            case DeviceCommandClient.COMMAND_TYPE_REQUEST_BODY_COLOR_CONFIG:
                return [true, new Uint8Array()];
            case DeviceCommandClient.COMMAND_TYPE_REQUEST_LED_COLOR_CONFIG:
                return [true, new Uint8Array()];
            case DeviceCommandClient.COMMAND_TYPE_REQUEST_SETTINGS_CONFIG:
                return [true, new Uint8Array()];
        }
        return [false, new Uint8Array()];
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
        return COMMAND_CLIENT_ID_DEVICE_CONTROL;
    }
}

class DeviceController {
    constructor() {
        mesh.eventEmitter.on('connectedDevicesChanged', (connectedDevices: P2PMacAddress[], added: P2PMacAddress[], removed: P2PMacAddress[]) => {
            // 新規追加されたデバイスのみ初期化
            for (const device of added) {
                this.initializeNode(device);
            }
        });
    }

    setPlayingState(state: "play" | "pause" | "stop"): void {
        switch (state) {
            case "play":
                playerSyncStates.metronomeState.getStore().value = true;
                this.sendCommand({
                    client_id: COMMAND_CLIENT_ID_DEVICE_CONTROL,
                    type: DeviceCommandClient.COMMAND_TYPE_PLAYING_STATE,
                });
                break;
            case "pause":
                playerSyncStates.metronomeState.getStore().value = false;
                this.sendCommand({
                    client_id: COMMAND_CLIENT_ID_DEVICE_CONTROL,
                    type: DeviceCommandClient.COMMAND_TYPE_PLAYING_STATE,
                });
                break;
            case "stop":
                playerSyncStates.metronomeState.getStore().value = false;
                this.sendCommand({
                    client_id: COMMAND_CLIENT_ID_DEVICE_CONTROL,
                    type: DeviceCommandClient.COMMAND_TYPE_STOP,
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
            client_id: COMMAND_CLIENT_ID_DEVICE_CONTROL,
            type: DeviceCommandClient.COMMAND_TYPE_BPM,
        });
    }

    requestNoteBuilderConfig(peer: P2PMacAddress): void {
        const handler = commandDispatcher.getCommandHandler(peer, false);
        if (!handler) {
            console.warn("requestNoteBuilderConfig() : handler unavailable");
            return;
        }

        handler.pushCommand({
            client_id: COMMAND_CLIENT_ID_DEVICE_CONTROL,
            type: DeviceCommandClient.COMMAND_TYPE_REQUEST_NOTE_BUILDER_CONFIG,
        });
    }

    requestGeneratorConfig(peer: P2PMacAddress): void {
        const handler = commandDispatcher.getCommandHandler(peer, false);
        if (!handler) {
            console.warn("requestGeneratorConfig() : handler unavailable");
            return;
        }

        handler.pushCommand({
            client_id: COMMAND_CLIENT_ID_DEVICE_CONTROL,
            type: DeviceCommandClient.COMMAND_TYPE_REQUEST_GENERATOR_CONFIG,
        });
    }

    requestTrackDetail(peer: P2PMacAddress): void {
        const handler = commandDispatcher.getCommandHandler(peer, false);
        if (!handler) {
            console.warn("requestTrackDetail() : handler unavailable");
            return;
        }

        handler.pushCommand({
            client_id: COMMAND_CLIENT_ID_DEVICE_CONTROL,
            type: DeviceCommandClient.COMMAND_TYPE_REQUEST_TRACK_DETAIL,
        });
    }

    requestBodyColorConfig(peer: P2PMacAddress): void {
        const handler = commandDispatcher.getCommandHandler(peer, false);
        if (!handler) {
            console.warn("requestBodyColorConfig() : handler unavailable");
            return;
        }

        handler.pushCommand({
            client_id: COMMAND_CLIENT_ID_DEVICE_CONTROL,
            type: DeviceCommandClient.COMMAND_TYPE_REQUEST_BODY_COLOR_CONFIG,
        });
    }

    requestLedColorConfig(peer: P2PMacAddress): void {
        const handler = commandDispatcher.getCommandHandler(peer, false);
        if (!handler) {
            console.warn("requestLedColorConfig() : handler unavailable");
            return;
        }

        handler.pushCommand({
            client_id: COMMAND_CLIENT_ID_DEVICE_CONTROL,
            type: DeviceCommandClient.COMMAND_TYPE_REQUEST_LED_COLOR_CONFIG,
        });
    }

    requestSettingsConfig(peer: P2PMacAddress, namespaces: string[]): void {
        const handler = commandDispatcher.getCommandHandler(peer, false);
        if (!handler) {
            console.warn("requestSettingsConfig() : handler unavailable");
            return;
        }

        // 設定要求コマンドを送信（ネームスペース情報を含む）
        handler.pushCommand({
            client_id: COMMAND_CLIENT_ID_DEVICE_CONTROL,
            type: DeviceCommandClient.COMMAND_TYPE_REQUEST_SETTINGS_CONFIG,
        });
    }

    private initializeNode(address: P2PMacAddress): void {
        const handler = commandDispatcher.getCommandHandler(address, true);
        if (!handler) {
            console.warn("initializeNode() : handler could not be created");
            return;
        }

        if (handler.hasClientInterface(COMMAND_CLIENT_ID_DEVICE_CONTROL)) {
            console.warn("initializeNode() : client interface already exists");
            return;
        }

        handler.setClientInterface(new DeviceCommandClient());
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

export const deviceController = new DeviceController();
