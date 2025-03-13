// components/Track.tsx
'use client';

import React from 'react';
import { P2PMacAddress } from '@/types/mesh';
import { getAddressString } from '@/lib/synthevery/connection/mesh-node';
import { Grid, Box, Typography, Slider, Switch } from '@mui/material';
import DraggableDeviceIcon from '@/components/player/DraggableDeviceIcon';
import { useDroppable } from '@dnd-kit/core'; // useDroppable をインポート
import { useAppStateContext } from '@/providers/appstate-provider';


interface TrackProps {
    trackNumber: number;
    assignedDevices: P2PMacAddress[];
    deviceColor: (address: P2PMacAddress) => string;
}


const Track: React.FC<TrackProps> = ({ trackNumber, assignedDevices, deviceColor }) => {
    const { trackStates, updateTrackStates } = useAppStateContext();

    const { isOver, setNodeRef } = useDroppable({ // useDroppable フックを使用
        id: `track-${trackNumber}`, // id をトラック番号の文字列にする
        data: { trackNumber } // data オプションでトラック番号を渡す
    });

    const handleMuteToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        trackStates[trackNumber].mute = event.target.checked;
        updateTrackStates(trackStates, true);
    };

    const handleVolumeChange = (event: Event, newValue: number | number[]) => {
        if (typeof newValue === 'number') {
            trackStates[trackNumber].volume = newValue;
            updateTrackStates(trackStates, true);
        }
    };

    if (trackStates.length <= trackNumber) {
        return <Box sx={{ minWidth: 300, backgroundColor: 'transparent' }}>
            <Typography variant="h6" align="center">Track {trackNumber}</Typography>
            <Typography variant="h6" align="center">unavailable</Typography>
        </Box>
    }

    return (
        <Box
            ref={setNodeRef}
            sx={{
                minWidth: 300,
                backgroundColor: isOver ? 'lightgreen' : 'transparent',
            }}>

            <Typography variant="h6" align="center">Track {trackNumber}</Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 5 }}>
                <Switch
                    checked={trackStates[trackNumber].mute}
                    onChange={handleMuteToggle}
                />
                <Slider
                    value={trackStates[trackNumber].volume}
                    onChange={handleVolumeChange}
                />
            </Box>

            <Typography variant="h6" align="center">Devices</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 100 }}>
                {assignedDevices.map((device) => (
                    <Box mt={1} mb={1} key={getAddressString(device.address)}>
                        <DraggableDeviceIcon device={device} color={deviceColor(device)} />
                    </Box>
                ))}
            </Box>

        </Box>
    );
};

export default Track;