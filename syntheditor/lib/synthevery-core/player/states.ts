import { SyncState, AppStateStore, serializeBoolean, deserializeBoolean, serializeMap, deserializeMap, serializeStringP2PMacAddress, deserializeStringP2PMacAddress, serializeUint8, deserializeUint8, serializeArrayFixedLength, deserializeArrayFixedLength } from "../appstate/appstates";
import { appStateSyncConnector } from "../appstate/sync";
import { APPSTATE_ID_PLAYER_METRONOME, APPSTATE_ID_PLAYER_RECORDER, APPSTATE_ID_PLAYER_QUANTIZER, APPSTATE_ID_PLAYER_CURRENT_TRACKS, APPSTATE_ID_PLAYER_TRACK_STATES, APPSTATE_ID_PLAYER_DEVICE_POSITIONS, APPSTATE_ID_PLAYER_TICK_CLOCK } from "../appstate/constants";
import { serializeTickClockState, deserializeTickClockState, serializeTrackState, deserializeTrackState } from "./util";
import { TickClockState, TrackState } from "../types/player";

class PlayerSyncStates {
    metronomeState: SyncState<boolean>;
    tickClockState: SyncState<TickClockState>;
    recorderState: SyncState<boolean>;
    quantizerState: SyncState<boolean>;
    currentTracksState: SyncState<Map<string, number>>;
    trackStates: SyncState<Array<TrackState>>;
    devicePositions: SyncState<Map<string, number>>;

    constructor() {
        this.metronomeState = new SyncState(APPSTATE_ID_PLAYER_METRONOME, new AppStateStore(
            false, serializeBoolean, deserializeBoolean
        ));
        this.tickClockState = new SyncState(APPSTATE_ID_PLAYER_TICK_CLOCK, new AppStateStore(
            { playing: false, bpm: 120 }, serializeTickClockState, deserializeTickClockState
        ));
        this.recorderState = new SyncState(APPSTATE_ID_PLAYER_RECORDER, new AppStateStore(
            false, serializeBoolean, deserializeBoolean
        ));
        this.quantizerState = new SyncState(APPSTATE_ID_PLAYER_QUANTIZER, new AppStateStore(
            false, serializeBoolean, deserializeBoolean
        ));
        this.currentTracksState = new SyncState(APPSTATE_ID_PLAYER_CURRENT_TRACKS, new AppStateStore(
            new Map(),
            (value) => serializeMap(value, serializeStringP2PMacAddress, serializeUint8, 6, 1),
            (data) => deserializeMap(data, deserializeStringP2PMacAddress, deserializeUint8, 6, 1)
        ));
        this.trackStates = new SyncState(APPSTATE_ID_PLAYER_TRACK_STATES, new AppStateStore(
            Array.from({ length: 8 }, (): TrackState => { return { loopLengthTick: 1920, mute: false, volume: 100 } }),
            (value) => serializeArrayFixedLength(value, serializeTrackState, 6),
            (data) => deserializeArrayFixedLength(data, deserializeTrackState, 6)
        ));
        this.devicePositions = new SyncState(APPSTATE_ID_PLAYER_DEVICE_POSITIONS, new AppStateStore(
            new Map(),
            (value) => serializeMap(value, serializeStringP2PMacAddress, serializeUint8, 6, 1),
            (data) => deserializeMap(data, deserializeStringP2PMacAddress, deserializeUint8, 6, 1)
        ));

        appStateSyncConnector.addState(this.metronomeState);
        appStateSyncConnector.addState(this.tickClockState);
        appStateSyncConnector.addState(this.recorderState);
        appStateSyncConnector.addState(this.quantizerState);
        appStateSyncConnector.addState(this.currentTracksState);
        appStateSyncConnector.addState(this.trackStates);
        appStateSyncConnector.addState(this.devicePositions);
    }
}

export const playerSyncStates = new PlayerSyncStates();
