// components/Tracks.tsx
'use client';

import React from 'react';
import Track from '@/components/player/Track';
import { Grid, Typography } from '@mui/material';
import { useMeshContext } from '@/providers/mesh-provider';
import { getDeviceColorByPosition } from '@/lib/synthevery/utils/device-color'; // getDeviceColorByPosition をインポート
import { P2PMacAddress } from '@/types/mesh';
import { useAppStateContext } from '@/providers/appstate-provider';
import { getAddressString, getAddressFromString } from '@/lib/synthevery/connection/mesh-node';
import { DndContext, DragEndEvent } from '@dnd-kit/core';

const Tracks: React.FC = () => {
    const { connectedDevices } = useMeshContext();

    const { currentTracksState, updateCurrentTracksState } = useAppStateContext();

    // TODO: AppStateContext からトラックごとの割り当てデバイス情報を取得する (仮の割り当て情報)

    const assignedDevices = new Map<number, P2PMacAddress[]>();

    for (const [address_string, track_number] of currentTracksState.entries()) {
        const address = getAddressFromString(address_string);

        // connectedDevices から address を探す
        const device = connectedDevices.find((device) => getAddressString(device.address) === address_string);

        if (device) {
            if (assignedDevices.has(track_number)) {
                assignedDevices.get(track_number)?.push(device);
            } else {
                assignedDevices.set(track_number, [device]);
            }
        }

    }

    const getDeviceColorByAddress = (address: P2PMacAddress) => {
        const address_string = getAddressString(address);
        const index = connectedDevices.findIndex((device) => getAddressString(device.address) === address_string);
        return getDeviceColorByPosition(index);
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over == null || active.data.current == null) {
            return;
        }

        if (active.data.current?.device && over.data.current?.trackNumber !== undefined) {
            const device = active.data.current.device;
            const trackNumber = over.data.current.trackNumber;
            console.log(`Device ${getAddressString(device.address)} moved to track ${trackNumber}`);

            if (currentTracksState.has(getAddressString(device.address))) {
                currentTracksState.set(getAddressString(device.address), trackNumber);
                updateCurrentTracksState(currentTracksState, true);
            } else {
                console.error(`Device ${getAddressString(device.address)} not found in currentTracksState`);
            }
        }


    }

    return (
        <div>
            <h2>Tracks</h2>

            <DndContext onDragEnd={handleDragEnd}>

                <Grid container spacing={2}>
                    {Array.from({ length: 8 }, (_, index) => (
                        <Track
                            key={index}
                            trackNumber={index}
                            assignedDevices={assignedDevices.get(index) || []}
                            deviceColor={getDeviceColorByAddress}
                        />
                    ))}
                </Grid>

            </DndContext>
        </div>

    );
};

export default Tracks;