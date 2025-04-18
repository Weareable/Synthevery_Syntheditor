'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useMeshContext } from '@/providers/mesh-provider';
import { MeshPacket } from '@/types/mesh';

interface MessageViewerProps {
    messageType: number;
}

const MessageViewer = ({ messageType }: MessageViewerProps) => {
    const { setCallback, removeCallback } = useMeshContext();
    const [messages, setMessages] = useState<MeshPacket[]>([]);

    useEffect(() => {
        const handleMessage = (packet: MeshPacket) => {
            console.log('Received packet:', packet);
            setMessages((prevMessages) => [...prevMessages, packet]);
        };

        setCallback(messageType, handleMessage); // コールバック登録

        return () => {
            removeCallback(messageType); // クリーンアップ時にコールバック解除
        };
    }, [setCallback, removeCallback, messageType]); // 最小限の依存関係

    return (
        <div>
            <h2>Received Messages</h2>
            <ul>
                {messages.map((msg, index) => (
                    <li key={index}>
                        <strong>Type:</strong> {msg.type}, <strong>Source:</strong>{' '}
                        {Array.from(msg.source.address.reverse()).map((byte) => byte.toString(16).padStart(2, '0')).join(':')},{' '}
                        <strong>Data:</strong> {Array.from(msg.data).map((byte) => byte.toString(16).padStart(2, '0')).join(' ')}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MessageViewer;
