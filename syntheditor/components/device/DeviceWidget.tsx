// components/DeviceWidget.tsx
'use client';

import React, { useState } from 'react';
import { P2PMacAddress } from '@/types/mesh';
import { getAddressString } from '@/lib/synthevery/connection/mesh-node';
import { Grid, Box, Typography, Radio, RadioGroup, FormControlLabel, FormControl } from '@mui/material';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import DeviceIcon from '@/components/player/DeviceIcon';
import { getDeviceColorByPosition } from '@/lib/synthevery/utils/device-color'; // getDeviceColorByPosition をインポート
import { useAppStateContext } from '@/providers/appstate-provider';



interface DeviceWidgetProps {
    device: P2PMacAddress;
    index: number; // index prop を追加
}


const DeviceWidget: React.FC<DeviceWidgetProps> = ({ device, index }) => { // index prop を受け取る
    const { currentTracksState, updateCurrentTracksState } = useAppStateContext();

    const selectedTrack = currentTracksState.get(getAddressString(device.address)) || 0;
    console.log(`DeviceWidget: selectedTrack: ${selectedTrack}`);
    console.log(`DeviceWidget: currentTracksState: ${currentTracksState}`);

    const macAddressString = getAddressString(device.address);

    const deviceColor = getDeviceColorByPosition(index); // deviceColor を index から生成

    const handleTrackChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log(`Device ${macAddressString} assigned to track: ${event.target.value}`);

        const trackNumber = parseInt(event.target.value);
        const address_string = getAddressString(device.address);

        if (currentTracksState.has(address_string)) {
            currentTracksState.set(address_string, trackNumber);
            updateCurrentTracksState(currentTracksState, true);
        } else {
            console.error(`Device ${macAddressString} not found in currentTracksState`);
        }
    };

    return (
        <Grid item xs={3}>
            <Box sx={{ p: 2, border: '1px solid lightgray', borderRadius: 1, textAlign: 'center' }}>
                {/* DeviceIcon コンポーネントに color prop を渡す */}
                <DeviceIcon device={device} color={deviceColor} />
                <Typography variant="subtitle1">{macAddressString}</Typography>

                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <FormControl component="fieldset" fullWidth>
                        <Typography variant="body2" align="left">Assign to Track</Typography>
                        <RadioGroup
                            aria-label="track"
                            name={`track-radio-group-device-${macAddressString}`}
                            value={selectedTrack}
                            onChange={handleTrackChange}
                        >
                            {Array.from({ length: 8 }, (_, i) => i).map((trackNumber) => (
                                <FormControlLabel
                                    key={trackNumber}
                                    value={String(trackNumber)}
                                    control={<Radio checked={selectedTrack == trackNumber} />}
                                    label={`Track ${trackNumber}`}
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>
                </Box>
            </Box>
        </Grid>
    );
};

export default DeviceWidget;