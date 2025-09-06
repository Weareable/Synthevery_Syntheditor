'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSynthevery } from '@/contexts/SyntheveryContext';
import { getAddressString } from '@/lib/synthevery-core/connection/util';

const DevicePanel: React.FC<{ address: string }> = ({ address }) => {
    const { mesh } = useSynthevery();
    const [connectedDevices, setConnectedDevices] = useState<string[]>([]);

    const device = useMemo(() => {
        return mesh.meshDevices.get(address);
    }, [address, mesh]);

    useEffect(() => {
        const handleConnectedDevicesChanged = () => {
            setConnectedDevices(device?.getConnectedDevices().map(device => getAddressString(device)) || []);
        };

        if (device) {
            device.eventEmitter.on('bleConnectedDevicesChanged', handleConnectedDevicesChanged);
            handleConnectedDevicesChanged();
        }

        return () => {
            if (device) {
                device.eventEmitter.removeListener('bleConnectedDevicesChanged', handleConnectedDevicesChanged);
            }
        };

    }, [device]);

    return (
        <div className="p-4 bg-card text-card-foreground rounded-lg border mb-4">
            <h2 className="text-lg font-semibold mb-3">{address}</h2>
            <ul className="space-y-2">
                {connectedDevices.map(device => (
                    <li key={device} className="p-2 bg-background rounded border">
                        {device}
                    </li>
                ))}
            </ul>
        </div>
    );
}

const MultiConnectExample: React.FC = () => {
    const { mesh } = useSynthevery();
    const [peerDevices, setPeerDevices] = useState<string[]>([]);

    const connectDevice = async () => {
        await mesh.connectDevice();
    }

    const updatePeerDevices = () => {
        console.log('updatePeerDevices');
        setPeerDevices(mesh.getConnectedPeers().map(device => getAddressString(device)));
    }

    useEffect(() => {
        mesh.eventEmitter.on('peerConnected', updatePeerDevices);
        mesh.eventEmitter.on('peerDisconnected', updatePeerDevices);

        return () => {
            mesh.eventEmitter.removeListener('peerConnected', updatePeerDevices);
            mesh.eventEmitter.removeListener('peerDisconnected', updatePeerDevices);
        }

    }, [mesh]);

    return (
        <div className="light min-h-screen bg-background text-foreground p-6">
            <button
                onClick={() => connectDevice()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors mb-6"
            >
                Connect
            </button>
            <div>
                {peerDevices.map(device => <DevicePanel key={device} address={device} />)}
            </div>
        </div>
    );
};

export default MultiConnectExample;