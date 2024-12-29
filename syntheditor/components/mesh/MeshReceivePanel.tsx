// app/mesh/MeshReceivePanel.tsx
'use client';

import React from 'react';
import { useMeshContext } from '@/providers/mesh-provider';

export default function MeshReceivePanel() {
    const { receivedMeshPackets } = useMeshContext();

    return (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <h2>Received Mesh Packets</h2>
            {receivedMeshPackets.length === 0 ? (
                <p>No packets received yet.</p>
            ) : (
                <ul>
                    {receivedMeshPackets.map((packet, index) => (
                        <li key={index}>
                            <strong>Type:</strong> {packet.type}<br />
                            <strong>Source:</strong> {Buffer.from(packet.source.address).toString('hex')}<br />
                            <strong>Destination:</strong> {Buffer.from(packet.destination.address).toString('hex')}<br />
                            <strong>Data:</strong> {Buffer.from(packet.data).toString('hex')}<br />
                            <strong>Index:</strong> {packet.index}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
