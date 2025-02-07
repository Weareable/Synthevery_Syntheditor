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
    const { metronomeState, updateMetronomeState, playingState, updatePlayingState, bpmState, updateBpmState, recorderState, updateRecorderState, quantizerState, updateQuantizerState, currentTracksState, updateCurrentTracksState, trackStates, updateTrackStates, devicePositions, updateDevicePositions } = useAppStateContext();

    console.log = console.info = console.debug = console.warn = console.error = () => { };

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

            <button onClick={() => updateRecorderState(!recorderState, true)}>Set Recorder State</button>
            <h3>
                recorder=
                {recorderState ? '⏺️' : '⏹️'}
            </h3>

            <button onClick={() => updateQuantizerState(!quantizerState, true)}>Set Quantizer State</button>
            <h3>
                quantizer=
                {quantizerState ? '✅' : '❌'}
            </h3>

            <BpmInput bpmState={bpmState} updateBpmState={(value: number) => updateBpmState(value, true)} />
            <h3>
                bpm=
                {bpmState}
            </h3>

            <h2>
                Current Tracks
            </h2>
            <ul>
                {Array.from(currentTracksState.entries()).map(([key, value]) => (
                    <li key={key}>{key}: {value}</li>
                ))}
            </ul>

            <h2>
                Track States
            </h2>
            <ul>
                {Array.from(trackStates.entries()).map(([key, value]) => (
                    <li key={key}>
                        <ul key={key}>
                            <li key="looplengthtick">{value.loopLengthTicks}</li>
                            <li key="mute">{value.mute ? '🔇' : '🔊'}</li>
                            <li key="volume">{value.volume}</li>
                        </ul>
                    </li>
                ))}
            </ul>

            <h2>
                Device Positions
            </h2>
            <ul>
                {Array.from(devicePositions.entries()).map(([key, value]) => (
                    <li key={key}>{key}: {value}</li>
                ))}
            </ul>
        </div>
    );
};

export default AppStateExample;