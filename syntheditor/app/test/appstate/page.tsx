// components/RoleExample.tsx
'use client';

import React from 'react';
import MeshStarter from '@/components/mesh/MeshStarter';
import { useAppStateContext } from '@/providers/appstate-provider';
import { useMeshContext } from '@/providers/mesh-provider'; // useMeshContext をインポート
import DeviceWidget from '@/components/device/DeviceWidget'; // DeviceWidget をインポート
import { getAddressString } from '@/lib/synthevery/connection/mesh-node';

import { Box, IconButton, Typography, TextField, Grid } from '@mui/material';
import MetronomeIcon from '@mui/icons-material/Timer';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import CheckIcon from '@mui/icons-material/Check';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { APP_MAC_ADDRESS } from '@/lib/synthevery/connection/constants';
import Tracks from '@/components/player/Tracks';
import { DndContext } from '@dnd-kit/core';
function BpmInput({ bpmState, updateBpmState }: { bpmState: number, updateBpmState: (value: number) => void }) {
    const [inputValue, setInputValue] = React.useState(bpmState);
    const prevValue = React.useRef(bpmState);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        setInputValue(bpmState);
        prevValue.current = bpmState;
    }, [bpmState]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value);
        setInputValue(newValue);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            if (newValue !== prevValue.current) {
                updateBpmState(newValue);
                prevValue.current = newValue;
            }
        }, 500);
    };

    return (
        <TextField
            label="BPM"
            type="number"
            value={inputValue}
            onChange={handleChange}
            sx={{ width: 80 }}
        />
    );
}


const AppStateExample: React.FC = () => {
    const { metronomeState, updateMetronomeState, playingState, updatePlayingState, bpmState, updateBpmState, recorderState, updateRecorderState, quantizerState, updateQuantizerState, currentTracksState, updateCurrentTracksState, trackStates, updateTrackStates, devicePositions, updateDevicePositions } = useAppStateContext();
    const { connectedDevices } = useMeshContext(); // connectedDevices を取得

    // console.log = console.info = console.debug = console.warn = console.error = () => { };

    return (
        <div>
            <h1>Synthevery AppState Example</h1>
            <MeshStarter />

            <DndContext>

            <Grid container spacing={1} alignItems="center"> {/* spacing を 1 に変更 */}
                <Grid item xs={2}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <IconButton onClick={() => updateMetronomeState(!metronomeState, true)} aria-label="set metronome state">
                            <MetronomeIcon color={metronomeState ? 'primary' : 'action'} /> {/* color="action" に変更 */}
                        </IconButton>
                        <Typography variant="body2" align="center">Metronome</Typography>
                        <Typography variant="caption" align="center">{metronomeState ? 'On' : 'Off'}</Typography>
                    </Box>
                </Grid>

                <Grid item xs={2}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <IconButton onClick={() => updatePlayingState(!playingState, true)} aria-label="set playing state">
                            {playingState ? <PauseIcon color="primary" /> : <PlayArrowIcon color="action" />} {/* color="action" に変更 */}
                        </IconButton>
                        <Typography variant="body2" align="center">Playing</Typography>
                        <Typography variant="caption" align="center">{playingState ? 'Playing' : 'Paused'}</Typography>
                    </Box>
                </Grid>

                <Grid item xs={2}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <IconButton onClick={() => updateRecorderState(!recorderState, true)} aria-label="set recorder state">
                            {recorderState ? <StopIcon color="primary" /> : <FiberManualRecordIcon color="action" />} {/* color="action" に変更 */}
                        </IconButton>
                        <Typography variant="body2" align="center">Recorder</Typography>
                        <Typography variant="caption" align="center">{recorderState ? 'Recording' : 'Stopped'}</Typography>
                    </Box>
                </Grid>

                <Grid item xs={2}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <IconButton onClick={() => updateQuantizerState(!quantizerState, true)} aria-label="set quantizer state">
                            <CheckIcon color={quantizerState ? 'primary' : 'action'} /> {/* color="action" に変更 */}
                        </IconButton>
                        <Typography variant="body2" align="center">Quantizer</Typography>
                        <Typography variant="caption" align="center">{quantizerState ? 'On' : 'Off'}</Typography>
                    </Box>
                </Grid>

                <Grid item xs={2}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <BpmInput bpmState={bpmState} updateBpmState={(value: number) => updateBpmState(value, true)} />
                        <Typography variant="body2" align="center">BPM</Typography>
                        <Typography variant="caption" align="center">{bpmState}</Typography>
                    </Box>
                </Grid>
            </Grid>

            <h2>Devices</h2>
            <Grid container spacing={2}>
                {connectedDevices.map((device, index) => ( // map 関数の第二引数 index を利用
                    <DeviceWidget key={getAddressString(device.address)} device={device} index={index} /> // index prop を渡す
                ))}
            </Grid>

            <Tracks />


            <h2>
                Current Tracks
            </h2>
            <ul>
                {Array.from(currentTracksState.entries()).map(([key, value]) => (
                    <li key={key}>{key}: {value}</li>
                ))}
            </ul>

            <h2>
                Track States
            </h2>
            <ul>
                {Array.from(trackStates.entries()).map(([key, value]) => (
                    <li key={key}>
                        <ul key={key}>
                            <li key="looplengthtick">{value.loopLengthTicks}</li>
                            <li key="mute">{value.mute ? '🔇' : '🔊'}</li>
                            <li key="volume">{value.volume}</li>
                        </ul>
                    </li>
                ))}
            </ul>

            <h2>
                Device Positions
            </h2>
            <ul>
                {Array.from(devicePositions.entries()).map(([key, value]) => (
                    <li key={key}>{key}: {value}</li>
                    ))}
                </ul>
            </DndContext>
        </div>
    );
};

export default AppStateExample;