// components/RoleExample.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { P2PMacAddress } from '@/types/mesh';
import { APP_MAC_ADDRESS, MESH_PACKET_TYPE_DEVICE_TYPE } from '@/lib/synthevery/connection/constants';
import { useDeviceTypeContext } from '@/providers/device-type-provider';
import MeshStarter from '@/components/mesh/MeshStarter';
import { useAppStateContext } from '@/providers/appstate-provider';

import { getAddressString, getAddressFromString } from '@/lib/synthevery/connection/mesh-node';

const AppStateExample: React.FC = () => {
    const { metronomeState, updateMetronomeState, retrieveAllStates } = useAppStateContext();

    return (
        <div>
            <h1>Synthevery AppState Example</h1>
            <MeshStarter />
            <button onClick={() => updateMetronomeState(!metronomeState, true)}>Set Metronome State</button>
            <h3>
                metronome=
                {metronomeState ? '✅' : '❌'}
            </h3>
        </div>
    );
};

export default AppStateExample;