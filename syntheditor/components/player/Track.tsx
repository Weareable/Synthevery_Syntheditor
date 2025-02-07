// components/Track.tsx
'use client';

import React from 'react';
import { P2PMacAddress } from '@/types/mesh';
import { getAddressString } from '@/lib/synthevery/connection/mesh-node';
import { Grid, Box, Typography, Slider, Switch } from '@mui/material';
import DraggableDeviceIcon from '@/components/player/DraggableDeviceIcon';
import { useDroppable } from '@dnd-kit/core'; // useDroppable をインポート





interface TrackProps {
    trackNumber: number;
    assignedDevices: P2PMacAddress[];
    deviceColor: (address: P2PMacAddress) => string;
}


const Track: React.FC<TrackProps> = ({ trackNumber, assignedDevices, deviceColor }) => {
    const [muted, setMuted] = React.useState<boolean>(false);
    const [volume, setVolume] = React.useState<number>(50);

    const { isOver, setNodeRef } = useDroppable({ // useDroppable フックを使用
        id: String(trackNumber), // id をトラック番号の文字列にする
    });


    const handleMuteToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMuted(event.target.checked);
    };

    const handleVolumeChange = (event: Event, newValue: number | number[]) => {
        if (typeof newValue === 'number') {
            setVolume(newValue);
        }
    };


    return (
        <Grid
            item
            xs={3}
            ref={setNodeRef} // setNodeRef を ref に設定
            style={{
                backgroundColor: isOver ? 'lightgreen' : 'transparent',
            }}
        >
            <Box sx={{ p: 2, border: '1px solid lightgray', borderRadius: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h6" align="center">Track {trackNumber}</Typography>

                {/* assignedDevice が存在する場合のみ DeviceIcon を表示 */}
                {assignedDevices.map((device) => (
                    <Box mt={1} mb={1} key={getAddressString(device.address)}>
                        <DraggableDeviceIcon device={device} color={deviceColor(device)} />
                    </Box>
                ))}


                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>Mute</Typography>
                        <Switch
                            checked={muted}
                            onChange={handleMuteToggle}
                            inputProps={{ 'aria-label': 'controlled' }}
                        />
                    </Box>

                    <Box sx={{ width: '100%', mb: 2 }}>
                        <Typography variant="body2" align="left">Volume</Typography>
                        <Slider
                            value={volume}
                            onChange={handleVolumeChange}
                            aria-labelledby="volume-slider"
                            valueLabelDisplay="auto"
                            min={0}
                            max={100}
                        />
                    </Box>

                    <Box>
                        <Typography variant="body2" align="center">
                            Assigned Device:
                        </Typography>
                        <Typography variant="caption" align="center">
                            {assignedDevices.map((device) => getAddressString(device.address)).join(', ')}
                        </Typography>
                    </Box>
                </Box>

            </Box>
        </Grid>
    );
};

export default Track;