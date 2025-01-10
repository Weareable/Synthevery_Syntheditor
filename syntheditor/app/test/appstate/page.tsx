// components/RoleExample.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { P2PMacAddress } from '@/types/mesh';
import { APP_MAC_ADDRESS, MESH_PACKET_TYPE_DEVICE_TYPE } from '@/lib/synthevery/connection/constants';
import { useDeviceTypeContext } from '@/providers/device-type-provider';
import MeshStarter from '@/components/mesh/MeshStarter';
import { useAppStateContext } from '@/providers/appstate-provider';

import { getAddressString, getAddressFromString } from '@/lib/synthevery/connection/mesh-node';

function BpmInput({ bpmState, updateBpmState }: { bpmState: number, updateBpmState: (value: number) => void }) {
    const [inputValue, setInputValue] = useState(bpmState);
    const prevValue = useRef(bpmState);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // bpmState が変更されたら inputValue を更新（データベース側の変更を反映）
    useEffect(() => {
        setInputValue(bpmState);
        prevValue.current = bpmState;
    }, [bpmState]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value);
        setInputValue(newValue);

        // 前回のリクエストをキャンセル
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // 一定時間経過後にデータベースへ更新
        timeoutRef.current = setTimeout(() => {
            if (newValue !== prevValue.current) { // 値が変更されていなければ更新しない
                updateBpmState(newValue); // データベース更新
                prevValue.current = newValue;
            }
        }, 500); // 500ミリ秒後に更新
    };

    return (
        <input
            type="number"
            value={inputValue}
            onChange={handleChange}
        />
    );
}


const AppStateExample: React.FC = () => {
    const { metronomeState, updateMetronomeState, playingState, updatePlayingState, bpmState, updateBpmState } = useAppStateContext();

    return (
        <div>
            <h1>Synthevery AppState Example</h1>
            <MeshStarter />
            <button onClick={() => updateMetronomeState(!metronomeState, true)}>Set Metronome State</button>
            <h3>
                metronome=
                {metronomeState ? '✅' : '❌'}
            </h3>

            <button onClick={() => updatePlayingState(!playingState, true)}>Set Playing State</button>
            <h3>
                playing=
                {playingState ? '▶️' : '⏸️'}
            </h3>

            <BpmInput bpmState={bpmState} updateBpmState={(value: number) => updateBpmState(value, true)} />
            <h3>
                bpm=
                {bpmState}
            </h3>
        </div>
    );
};

export default AppStateExample;