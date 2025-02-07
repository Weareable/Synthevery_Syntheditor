'use client';

import React from 'react';
import { P2PMacAddress } from '@/types/mesh';
import { getAddressString } from '@/lib/synthevery/connection/mesh-node';
import { IconButton } from '@mui/material';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import { useDraggable } from '@dnd-kit/core'; // useDraggable をインポート


interface DraggableDeviceIconProps {
    device: P2PMacAddress;
    color: string;
}


const DraggableDeviceIcon: React.FC<DraggableDeviceIconProps> = ({ device, color }) => {
    const macAddressString = getAddressString(device.address);


    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ // useDraggable フックを使用

        id: getAddressString(device.address), // id を MAC アドレス文字列にする
        data: { device }, // data オプションでデバイス情報を渡す
    });

    const transformStyle = transform
        ? `translate(${transform.x}px, ${transform.y}px)`
        : undefined;

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={{
                transform: transformStyle,
                height: "fit-content"
            }}
        >

            <IconButton
                aria-label="device icon"

                style={{
                    opacity: isDragging ? 0.5 : 1,
                    cursor: 'grab',
                }}
                title={macAddressString}
            >
                <DeviceHubIcon fontSize="large" sx={{ color: color }} />
            </IconButton>
        </div>

    );
};

export default DraggableDeviceIcon;