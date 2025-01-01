// components/RoleExample.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { P2PMacAddress } from '@/types/mesh';
import { APP_MAC_ADDRESS, MESH_PACKET_TYPE_DEVICE_TYPE } from '@/lib/synthevery/connection/constants';
import { useDeviceTypeContext } from '@/providers/device-type-provider';
import MeshStarter from '@/components/mesh/MeshStarter';

import { getAddressString, getAddressFromString } from '@/lib/synthevery/connection/mesh-node';

const RoleExample: React.FC = () => {

    const { registry } = useDeviceTypeContext();

    console.log('RoleExample initialized');
    console.log(registry?.nodeRoles);

    return (
        <div>
            <MeshStarter />
            <div>
                {registry?.getRoles({ address: APP_MAC_ADDRESS }).size}
            </div>

            <div>
                {Array.from(registry?.nodeRoles.keys() ?? []).map((address) => {
                    return <div key={address}>{address} - {Array.from(registry?.nodeRoles.get(address) ?? []).join(', ')}</div>;
                })}
            </div>

            <h2>
                {getAddressString({ address: APP_MAC_ADDRESS })}
                {Array.from(getAddressFromString(getAddressString({ address: APP_MAC_ADDRESS })).address)}
            </h2>
        </div>
    );
};

export default RoleExample;