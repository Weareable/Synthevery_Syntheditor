'use client';

import React, { useState } from 'react';
import { useBLEContext } from '@/providers/ble-provider';
import { useMeshContext } from '@/providers/mesh-provider';
import { MESH_SERVICE_UUID, CONNECTION_INFO_SERVICE_UUID } from '@/lib/synthevery/connection/constants';

const MeshStarter = () => {
    const { connect, isConnected } = useBLEContext();
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async () => {
        try {
            setError(null);
            await connect({
                filters: [{ services: [MESH_SERVICE_UUID] }],
                optionalServices: [MESH_SERVICE_UUID, CONNECTION_INFO_SERVICE_UUID],
            });
            console.log('Device connected successfully!');
        } catch (err) {
            console.error('Error during device connection:', err);
            setError('Failed to connect to the device. Please try again.');
        }
    };

    return (
        <div>
            <h2>Mesh Starter</h2>
            <button onClick={handleConnect} disabled={isConnected}>
                {isConnected ? 'Connected' : 'Connect to Device'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default MeshStarter;
