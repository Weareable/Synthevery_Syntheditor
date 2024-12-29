'use client';

import React, { useState } from 'react';
import { useBLEContext } from '@/providers/ble-provider';
import { useMeshContext } from '@/providers/mesh-provider';
import { MESH_SERVICE_UUID, CONNECTION_INFO_SERVICE_UUID } from '@/lib/synthevery/connection/constants';

const MeshStarter = () => {
    const { connect } = useBLEContext();
    const { initializeMesh } = useMeshContext();
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async () => {
        try {
            setError(null);
            await connect({
                filters: [{ services: [MESH_SERVICE_UUID] }],
                optionalServices: [MESH_SERVICE_UUID, CONNECTION_INFO_SERVICE_UUID],
            });
            setIsConnected(true);
            console.log('Device connected successfully!');
        } catch (err) {
            console.error('Error during device connection:', err);
            setError('Failed to connect to the device. Please try again.');
        }
    };

    const handleStartMesh = async () => {
        try {
            if (!isConnected) {
                throw new Error('Device is not connected. Connect to a device first.');
            }
            console.log('Starting Mesh functionality...');
            await initializeMesh();
        } catch (err) {
            console.error('Error during Mesh initialization:', err);
            setError('Failed to start Mesh. Please try again.');
        }
    };

    return (
        <div>
            <h2>Mesh Starter</h2>
            <button onClick={handleConnect} disabled={isConnected}>
                {isConnected ? 'Connected' : 'Connect to Device'}
            </button>
            <button onClick={handleStartMesh} disabled={!isConnected}>
                Start Mesh
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default MeshStarter;
