'use client';

import useMesh from '@/hooks/useMesh';
import { playerSyncStates } from '@/lib/synthevery-core/player/states';
import useDeviceControl from '@/hooks/useDeviceControl';
import { useAppState, useReadOnlyAppState } from '@/hooks/useAppState';

const AppStateExample: React.FC = () => {
    const { connectedDevices, connectedPeers, connectDevice, disconnectDevice } = useMesh();

    const [quantizerState, updateQuantizerState] = useAppState(playerSyncStates.quantizerState);
    const [metronomeState, updateMetronomeState] = useAppState(playerSyncStates.metronomeState);
    const [recorderState, updateRecorderState] = useAppState(playerSyncStates.recorderState);
    const { setPlayingState, setBpmState, stop } = useDeviceControl();
    const tickClockState = useReadOnlyAppState(playerSyncStates.tickClockState);

    const [trackStates, updateTrackStates] = useAppState(playerSyncStates.trackStates);
    const [currentTracks, updateCurrentTracks] = useAppState(playerSyncStates.currentTracksState);

    return (
        <div>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer" onClick={() => connectDevice()}>Connect</button>
            <div>
                <h2>Connected Peers (Directly Connected)</h2>
                {connectedPeers.map(device => <li key={device}>{device}</li>)}
            </div>
            <div>
                <h2>Connected Devices (Directly + Indirectly Connected)</h2>
                {connectedDevices.map(device => <li key={device}>{device}</li>)}
            </div>

            <div>
                <h2>Metronome</h2>
                Metronome: {metronomeState ? 'On' : 'Off'}
                <button onClick={() => updateMetronomeState(!metronomeState)}>Toggle</button>
            </div>

            <div>
                <h2>Quantizer</h2>
                Quantizer: {quantizerState ? 'On' : 'Off'}
                <button onClick={() => updateQuantizerState(!quantizerState)}>Toggle</button>
            </div>

            <div>
                <h2>Recorder</h2>
                Recorder: {recorderState ? 'On' : 'Off'}
                <button onClick={() => updateRecorderState(!recorderState)}>Toggle</button>
            </div>

            <div>
                <h2>Playing</h2>
                Playing: {tickClockState.playing ? 'On' : 'Off'}
                <button onClick={() => setPlayingState(!tickClockState.playing)}>Toggle</button>
            </div>

            <div>
                <h2>BPM</h2>
                BPM: {tickClockState.bpm}
                <button onClick={() => setBpmState(tickClockState.bpm + 1)}>Increase</button>
                <button onClick={() => setBpmState(tickClockState.bpm - 1)}>Decrease</button>
            </div>

            <div>
                <h2>Current Tracks</h2>
                {Array.from(currentTracks.entries()).map(([key, value]) => (
                    <div key={key}>
                        <h3>Track {key}</h3>
                        <p>Track: {value}</p>
                        <button onClick={() => updateCurrentTracks(new Map(currentTracks).set(key, (value + 1) % 8))}>Increase</button>
                        <button onClick={() => updateCurrentTracks(new Map(currentTracks).set(key, (value + 7) % 8))}>Decrease</button>
                    </div>
                ))}
            </div>

            <div>
                <h2>Track States</h2>
                {trackStates.map((trackState, index) => (
                    <div key={index}>
                        <h3>Track {index}</h3>
                        <p>Mute: {trackState.mute ? 'Muted' : 'Unmuted'}</p>
                        <button onClick={() => updateTrackStates([...trackStates].map((value, i) => i === index ? { ...value, mute: !value.mute } : value))}>Toggle</button>
                        <p>Volume: {trackState.volume}</p>
                        <button onClick={() => updateTrackStates([...trackStates].map((value, i) => i === index ? { ...value, volume: value.volume + 10 } : value))}>Increase</button>
                        <button onClick={() => updateTrackStates([...trackStates].map((value, i) => i === index ? { ...value, volume: value.volume - 10 } : value))}>Decrease</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AppStateExample;