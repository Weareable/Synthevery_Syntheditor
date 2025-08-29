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
        <div className="light min-h-screen bg-background text-foreground p-6">
            <button
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded cursor-pointer transition-colors"
                onClick={() => connectDevice()}
            >
                Connect
            </button>

            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-3">Connected Peers (Directly Connected)</h2>
                <ul className="space-y-2">
                    {connectedPeers.map(device => (
                        <li key={device} className="p-3 bg-card text-card-foreground rounded-md border">
                            {device}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-3">Connected Devices (Directly + Indirectly Connected)</h2>
                <ul className="space-y-2">
                    {connectedDevices.map(device => (
                        <li key={device} className="p-3 bg-card text-card-foreground rounded-md border">
                            {device}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mt-6 p-4 bg-card text-card-foreground rounded-lg border">
                <h2 className="text-lg font-semibold mb-3">Metronome</h2>
                <div className="flex items-center gap-4">
                    <span>Metronome: {metronomeState ? 'On' : 'Off'}</span>
                    <button
                        onClick={() => updateMetronomeState(!metronomeState)}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                    >
                        Toggle
                    </button>
                </div>
            </div>

            <div className="mt-6 p-4 bg-card text-card-foreground rounded-lg border">
                <h2 className="text-lg font-semibold mb-3">Quantizer</h2>
                <div className="flex items-center gap-4">
                    <span>Quantizer: {quantizerState ? 'On' : 'Off'}</span>
                    <button
                        onClick={() => updateQuantizerState(!quantizerState)}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                    >
                        Toggle
                    </button>
                </div>
            </div>

            <div className="mt-6 p-4 bg-card text-card-foreground rounded-lg border">
                <h2 className="text-lg font-semibold mb-3">Recorder</h2>
                <div className="flex items-center gap-4">
                    <span>Recorder: {recorderState ? 'On' : 'Off'}</span>
                    <button
                        onClick={() => updateRecorderState(!recorderState)}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                    >
                        Toggle
                    </button>
                </div>
            </div>

            <div className="mt-6 p-4 bg-card text-card-foreground rounded-lg border">
                <h2 className="text-lg font-semibold mb-3">Playing</h2>
                <div className="flex items-center gap-4">
                    <span>Playing: {tickClockState.playing ? 'On' : 'Off'}</span>
                    <button
                        onClick={() => setPlayingState(!tickClockState.playing)}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                    >
                        Toggle
                    </button>
                </div>
            </div>

            <div className="mt-6 p-4 bg-card text-card-foreground rounded-lg border">
                <h2 className="text-lg font-semibold mb-3">BPM</h2>
                <div className="flex items-center gap-4">
                    <span>BPM: {tickClockState.bpm}</span>
                    <button
                        onClick={() => setBpmState(tickClockState.bpm + 1)}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                    >
                        Increase
                    </button>
                    <button
                        onClick={() => setBpmState(tickClockState.bpm - 1)}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                    >
                        Decrease
                    </button>
                </div>
            </div>

            <div className="mt-6 p-4 bg-card text-card-foreground rounded-lg border">
                <h2 className="text-lg font-semibold mb-3">Current Tracks</h2>
                <div className="space-y-4">
                    {Array.from(currentTracks.entries()).map(([key, value]) => (
                        <div key={key} className="p-3 bg-background rounded-md border">
                            <h3 className="font-semibold mb-2">Track {key}</h3>
                            <p className="mb-2">Track: {value}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateCurrentTracks(new Map(currentTracks).set(key, (value + 1) % 8))}
                                    className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                                >
                                    Increase
                                </button>
                                <button
                                    onClick={() => updateCurrentTracks(new Map(currentTracks).set(key, (value + 7) % 8))}
                                    className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                                >
                                    Decrease
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6 p-4 bg-card text-card-foreground rounded-lg border">
                <h2 className="text-lg font-semibold mb-3">Track States</h2>
                <div className="space-y-4">
                    {trackStates.map((trackState, index) => (
                        <div key={index} className="p-3 bg-background rounded-md border">
                            <h3 className="font-semibold mb-2">Track {index}</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                    <span>Mute: {trackState.mute ? 'Muted' : 'Unmuted'}</span>
                                    <button
                                        onClick={() => updateTrackStates([...trackStates].map((value, i) => i === index ? { ...value, mute: !value.mute } : value)))}
                                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80 transition-colors"
                                    >
                                    Toggle
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <span>Volume: {trackState.volume}</span>
                                <button
                                    onClick={() => updateTrackStates([...trackStates].map((value, i) => i === index ? { ...value, volume: value.volume + 10 } : value)))}
                                className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                                    >
                                Increase
                            </button>
                            <button
                                onClick={() => updateTrackStates([...trackStates].map((value, i) => i === index ? { ...value, volume: value.volume - 10 } : value)))}
                            className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                                    >
                            Decrease
                        </button>
                                </div>
            </div>
        </div>
    ))
}
                </div >
            </div >
        </div >
    );
};

export default AppStateExample;