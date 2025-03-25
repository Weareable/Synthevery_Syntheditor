'use client';

import React, { useEffect, useMemo, useState } from 'react';
import useMesh from '@/hooks/useMesh';
import { playerSyncStates } from '@/lib/synthevery-core/player/states';

import useAppState from '@/hooks/useAppState';

const AppStateExample: React.FC = () => {
    const { connectedDevices, connectedPeers, connectDevice, disconnectDevice } = useMesh();

    const [quantizerState, updateQuantizerState] = useAppState(playerSyncStates.quantizerState);
    const [metronomeState, updateMetronomeState] = useAppState(playerSyncStates.metronomeState);

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

            <div>
                <h2>Metronome</h2>
                Metronome: {metronomeState ? 'On' : 'Off'}
                <button onClick={() => updateMetronomeState(!metronomeState)}>Toggle</button>
            </div>

            <div>
                <h2>Quantizer</h2>
                Quantizer: {quantizerState ? 'On' : 'Off'}
                <button onClick={() => updateQuantizerState(!quantizerState)}>Toggle</button>
            </div>


        </div>
    );
};

export default AppStateExample;