'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Mesh } from '@/lib/synthevery-core/connection/mesh';
import { getAddressString } from '@/lib/synthevery-core/connection/util';
const mesh = new Mesh();

const DevicePanel: React.FC<{ address: string }> = ({ address }) => {
    const [connectedDevices, setConnectedDevices] = useState<string[]>([]);

    const device = useMemo(() => {
        return mesh.meshDevices.get(address);
    }, [address]);

    useEffect(() => {
        const handleConnectedDevicesChanged = () => {
            setConnectedDevices(device?.getConnectedDevices().map(device => getAddressString(device)) || []);
        };

        if (device) {
            device.eventEmitter.on('connectedDevicesChanged', handleConnectedDevicesChanged);
            handleConnectedDevicesChanged();
        }

        return () => {
            if (device) {
                device.eventEmitter.removeListener('connectedDevicesChanged', handleConnectedDevicesChanged);
            }
        };

    }, [device]);

    return <div>
        <h2>{address}</h2>
        <ul>
            {connectedDevices.map(device => <li key={device}>{device}</li>)}
        </ul>
    </div>;
}

const MultiConnectExample: React.FC = () => {
    const [peerDevices, setPeerDevices] = useState<string[]>([]);

    const connectDevice = async () => {
        await mesh.connectDevice();
    }

    const updatePeerDevices = () => {
        console.log('updatePeerDevices');
        setPeerDevices(mesh.getConnectedDevices().map(device => getAddressString(device)));
    }

    useEffect(() => {
        mesh.eventEmitter.on('connected', updatePeerDevices);
        mesh.eventEmitter.on('disconnected', updatePeerDevices);

        return () => {
            mesh.eventEmitter.removeListener('connected', updatePeerDevices);
            mesh.eventEmitter.removeListener('disconnected', updatePeerDevices);
        }

    }, []);

    return (
        <div>
            <button onClick={() => connectDevice()}>Connect</button>
            <div>
                {peerDevices.map(device => <DevicePanel key={device} address={device} />)}
            </div>
        </div>
    );
};

export default MultiConnectExample;