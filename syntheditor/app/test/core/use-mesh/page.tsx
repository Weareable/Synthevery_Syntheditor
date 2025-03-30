'use client';

import React, { useEffect, useMemo, useState } from 'react';
import useMesh from '@/hooks/useMesh';


const MultiConnectExample: React.FC = () => {
    const { connectedDevices, connectedPeers, connectDevice, disconnectDevice } = useMesh();

    return (
        <div>
            <button onClick={() => connectDevice()}>Connect</button>
            <div>
                <h2>Connected Peers (Directly Connected)</h2>
                {connectedPeers.map(device => <li key={device}>{device}</li>)}
            </div>
            <div>
                <h2>Connected Devices (Directly + Indirectly Connected)</h2>
                {connectedDevices.map(device => <li key={device}>{device}</li>)}
            </div>
        </div>
    );
};

export default MultiConnectExample;