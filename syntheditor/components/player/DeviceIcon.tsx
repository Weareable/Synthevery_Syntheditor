// components/DeviceIcon.tsx
'use client';

import React from 'react';
import { P2PMacAddress } from '@/types/mesh';
import { getAddressString } from '@/lib/synthevery/connection/mesh-node';
import { IconButton } from '@mui/material';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import { useDraggable } from '@dnd-kit/core'; // useDraggable をインポート

interface DeviceIconProps {
    device: P2PMacAddress;
    color: string;
}

const DeviceIcon: React.FC<DeviceIconProps> = ({ device, color }) => {
    const macAddressString = getAddressString(device.address);
    return (
        <IconButton
            aria-label="device icon"
            disabled
            title={macAddressString}
        >
            <DeviceHubIcon fontSize="large" sx={{ color: color }} />
        </IconButton>
    );
};

export default DeviceIcon;