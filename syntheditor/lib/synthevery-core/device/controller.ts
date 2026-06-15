import { CommandClientInterface } from "../command/handler";
import { CommandID } from "../types/command";
import { COMMAND_CLIENT_ID_DEVICE_CONTROL, COMMAND_CLIENT_ID_EDITOR_SETTINGS_CONFIG } from "../command/constants";
import { PlayerSyncStates } from "../player/states";
import { Mesh } from "../connection/mesh";
import { P2PMacAddress } from "../types/mesh";
import { CommandDispatcher } from "../command/dispatcher";
import { serializeBoolean, serializeFloat32 } from "../appstate/appstates";
import { PayloadCommandClient } from "../command/payload-command-client";
import { getAddressString } from "../connection/util";
import { CrdtProjectionStore } from "../crdt/projection-store";

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
    static readonly COMMAND_TYPE_REQUEST_CHORD_SCALE_CONFIG = 0x16;
    static readonly COMMAND_TYPE_RESET_TRACK_BASE = 0x20; // 0x20 - 0x27 (track 0-7)

    static readonly COMMAND_TYPE_PLAYING_STATE_SIZE = 1;
    static readonly COMMAND_TYPE_BPM_SIZE = 4;

    private playerSyncStates: PlayerSyncStates;

    constructor(playerSyncStates: PlayerSyncStates) {
        this.playerSyncStates = playerSyncStates;
    }

    generateData(commandId: CommandID): Uint8Array {
        switch (commandId.type) {
            case DeviceCommandClient.COMMAND_TYPE_PLAYING_STATE:
                return serializeBoolean(this.playerSyncStates.metronomeState.getStore().value);
            case DeviceCommandClient.COMMAND_TYPE_BPM:
                return serializeFloat32(this.playerSyncStates.tickClockState.getStore().value.bpm);
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

        // RESET_TRACK (0x20 - 0x27): empty payload
        if (
            commandId.type >= DeviceCommandClient.COMMAND_TYPE_RESET_TRACK_BASE &&
            commandId.type <= DeviceCommandClient.COMMAND_TYPE_RESET_TRACK_BASE + 7
        ) {
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
        // RESET_TRACK (0x20 - 0x27)
        if (
            commandId.type >= DeviceCommandClient.COMMAND_TYPE_RESET_TRACK_BASE &&
            commandId.type <= DeviceCommandClient.COMMAND_TYPE_RESET_TRACK_BASE + 7
        ) {
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

export class DeviceController {
    private mesh: Mesh;
    private commandDispatcher: CommandDispatcher;
    private playerSyncStates: PlayerSyncStates;
    private crdtProjectionStore: CrdtProjectionStore;
    private settingsClients: Map<string, PayloadCommandClient> = new Map();

    constructor(mesh: Mesh, commandDispatcher: CommandDispatcher, playerSyncStates: PlayerSyncStates, crdtProjectionStore: CrdtProjectionStore) {
        this.mesh = mesh;
        this.commandDispatcher = commandDispatcher;
        this.playerSyncStates = playerSyncStates;
        this.crdtProjectionStore = crdtProjectionStore;

        this.mesh.eventEmitter.on('connectedDevicesChanged', (connectedDevices: P2PMacAddress[], added: P2PMacAddress[], removed: P2PMacAddress[]) => {
            // 新規追加されたデバイスのみ初期化
            for (const device of added) {
                this.initializeNode(device);
            }
        });
    }

    setPlayingState(state: "play" | "pause" | "stop"): void {
        switch (state) {
            case "play":
                this.playerSyncStates.metronomeState.getStore().value = true;
                this.sendCommand({
                    client_id: COMMAND_CLIENT_ID_DEVICE_CONTROL,
                    type: DeviceCommandClient.COMMAND_TYPE_PLAYING_STATE,
                });
                break;
            case "pause":
                this.playerSyncStates.metronomeState.getStore().value = false;
                this.sendCommand({
                    client_id: COMMAND_CLIENT_ID_DEVICE_CONTROL,
                    type: DeviceCommandClient.COMMAND_TYPE_PLAYING_STATE,
                });
                break;
            case "stop":
                this.playerSyncStates.metronomeState.getStore().value = false;
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
        this.playerSyncStates.tickClockState.getStore().value.bpm = bpm;
        this.sendCommand({
            client_id: COMMAND_CLIENT_ID_DEVICE_CONTROL,
            type: DeviceCommandClient.COMMAND_TYPE_BPM,
        });
    }

    resetTrack(trackIndexZeroBased: number): void {
        if (trackIndexZeroBased < 0 || trackIndexZeroBased > 7) {
            console.warn("resetTrack() : invalid track index, must be 0-7");
            return;
        }

        // Clear CRDT state for this track
        this.crdtProjectionStore.clearTrack(trackIndexZeroBased);

        // メッシュ内の全デバイスへクリアコマンドを送信（直接ピアだけでなく全ノード）
        const devices = this.mesh.getConnectedDevices();
        if (devices.length === 0) {
            console.warn("resetTrack() : no connected devices");
            return;
        }

        // 重複アドレスを排除
        const unique = new Map<string, P2PMacAddress>();
        for (const d of devices) {
            const key = getAddressString(d.address);
            unique.set(key, d);
        }

        for (const device of unique.values()) {
            const handler = this.commandDispatcher.getCommandHandler(device, false);
            if (!handler) {
                console.warn("resetTrack() : handler unavailable for", getAddressString(device.address));
                continue;
            }
            handler.pushCommand({
                client_id: COMMAND_CLIENT_ID_DEVICE_CONTROL,
                type: DeviceCommandClient.COMMAND_TYPE_RESET_TRACK_BASE + trackIndexZeroBased,
            });
        }
    }

    requestNoteBuilderConfig(peer: P2PMacAddress): void {
        const handler = this.commandDispatcher.getCommandHandler(peer, false);
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
        const handler = this.commandDispatcher.getCommandHandler(peer, false);
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
        const handler = this.commandDispatcher.getCommandHandler(peer, false);
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
        const handler = this.commandDispatcher.getCommandHandler(peer, false);
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
        const handler = this.commandDispatcher.getCommandHandler(peer, false);
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
        const handler = this.commandDispatcher.getCommandHandler(peer, false);
        if (!handler) {
            console.warn("requestSettingsConfig() : handler unavailable");
            return;
        }

        const peerKey = getAddressString(peer.address);
        let client = this.settingsClients.get(peerKey);
        if (!client) {
            // Ensure client is registered if initializeNode wasn't called yet for some reason
            const createHandler = this.commandDispatcher.getCommandHandler(peer, true);
            if (!createHandler) {
                console.warn("requestSettingsConfig() : could not create handler");
                return;
            }
            client = new PayloadCommandClient(COMMAND_CLIENT_ID_EDITOR_SETTINGS_CONFIG);
            createHandler.setClientInterface(client);
            this.settingsClients.set(peerKey, client);
        }

        const encoder = new TextEncoder();
        const path = namespaces.join('.');
        const payload = encoder.encode(path);
        const out: CommandID = { client_id: client.getClientID(), type: 0 };
        const ok = client.allocateAndPrepare(out, payload);
        if (!ok) {
            console.warn("requestSettingsConfig() : allocate failed");
            return;
        }
        handler.pushCommand(out);
    }

    requestChordScaleConfig(peer: P2PMacAddress): void {
        const handler = this.commandDispatcher.getCommandHandler(peer, false);
        if (!handler) {
            console.warn("requestChordScaleConfig() : handler unavailable");
            return;
        }

        handler.pushCommand({
            client_id: COMMAND_CLIENT_ID_DEVICE_CONTROL,
            type: DeviceCommandClient.COMMAND_TYPE_REQUEST_CHORD_SCALE_CONFIG,
        });
    }

    private initializeNode(address: P2PMacAddress): void {
        const handler = this.commandDispatcher.getCommandHandler(address, true);
        if (!handler) {
            console.warn("initializeNode() : handler could not be created");
            return;
        }

        if (!handler.hasClientInterface(COMMAND_CLIENT_ID_DEVICE_CONTROL)) {
            handler.setClientInterface(new DeviceCommandClient(this.playerSyncStates));
        } else {
            console.warn("initializeNode() : device control client already exists");
        }

        if (!handler.hasClientInterface(COMMAND_CLIENT_ID_EDITOR_SETTINGS_CONFIG)) {
            const client = new PayloadCommandClient(COMMAND_CLIENT_ID_EDITOR_SETTINGS_CONFIG);
            handler.setClientInterface(client);
            this.settingsClients.set(getAddressString(address.address), client);
        }
    }

    sendCommand(commandId: CommandID): void {
        if (this.mesh.getConnectedPeers().length === 0) {
            console.warn("sendCommand() : no connected peers");
            return;
        }

        const handler = this.commandDispatcher.getCommandHandler(this.mesh.getConnectedPeers()[0], false);
        if (!handler) {
            console.warn("sendCommand() : handler unavailable");
            return;
        }

        handler.pushCommand(commandId);
    }
}

// シングルトンインスタンスの即座生成を停止
// export const deviceController = new DeviceController();
