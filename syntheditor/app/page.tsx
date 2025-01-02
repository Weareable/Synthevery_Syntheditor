import React from 'react';
import MeshStarter from '@/components/mesh/MeshStarter';
import MessageViewer from '@/components/mesh/MessageViewer';

const MeshPage = () => {
    return (
        <div>
            <h1>Mesh Communication</h1>
            <p>Connect to a BLE device, start Mesh communication, and view received messages.</p>
            <div style={{ marginBottom: '20px' }}>
                <MeshStarter />
            </div>
            <div>
                <MessageViewer messageType={255} />
            </div>
        </div>
    );
};

export default MeshPage;
