"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { syntheveryServiceContainer } from '@/lib/synthevery-core/service-container';

const NUM_TRACKS = 8; // 8トラック対応

// 旧: UI側で editors/sets を生成して setupCrdtSync していた構成を廃止
// 新: サービスの投影ストアに任せ、UI は参照だけにする

export default function Page() {
    const servicesRef = useRef(syntheveryServiceContainer.initialize());
    const [tick, setTick] = useState(0);
    const [connecting, setConnecting] = useState(false);
    const [peers, setPeers] = useState<string[]>([]);
    const [trackProjections, setTrackProjections] = useState<string[][]>(Array(NUM_TRACKS).fill(null).map(() => []));

    useEffect(() => {
        const services = servicesRef.current;
        const store = services.crdtProjectionStore;
        // subscribe mesh events to list peers
        const mesh = services.mesh as any;
        const onChanged = (devices: any) => {
            setPeers((devices || []).map((d: any) => Array.from<number>(d.address as Iterable<number>).map(b => b.toString(16).padStart(2, '0')).reverse().join(':')));
        };
        mesh.eventEmitter.on('connectedDevicesChanged', onChanged);
        const timer = setInterval(() => {
            setTick(prev => {
                const t = prev + 1;
                // compute projection list lines for each track from service store
                try {
                    const proj = store.getTrackProjections();
                    const newProjections = proj.map((p, trackIndex) => {
                        return p.notes.map(n => `t=${n.tick} c=${n.channel} k=${n.key} type=${n.type}`)
                    })
                    setTrackProjections(newProjections);
                } catch (_e) {
                    // ignore
                }
                return t;
            });
        }, 200);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="p-4 space-y-3">
            <h2 className="text-lg font-bold">CRDT Sequence Test (Multi-Track)</h2>
            <div className="text-sm text-gray-500">tick: {tick}</div>
            <div className="space-x-2">
                <button className="px-2 py-1 border rounded" disabled={connecting} onClick={async () => {
                    try {
                        setConnecting(true);
                        await (servicesRef.current.mesh as any).connectDevice();
                    } finally {
                        setConnecting(false);
                    }
                }}>{connecting ? 'Connecting...' : 'Connect Device'}</button>
                <button className="px-2 py-1 border rounded" onClick={() => setTrackProjections(Array(NUM_TRACKS).fill(null).map(() => []))}>Clear All Views</button>
            </div>
            <div className="text-xs text-gray-600">Peers: {peers.join(', ') || 'none'}</div>

            {/* トラックごとの表示 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array(NUM_TRACKS).fill(null).map((_, trackIndex) => (
                    <div key={trackIndex} className="border rounded p-3 space-y-2">
                        <h3 className="text-sm font-semibold">Track {trackIndex}</h3>

                        <div>
                            <h4 className="text-xs font-medium text-gray-600 mb-1">Projection</h4>
                            <div className="text-xs whitespace-pre-wrap border rounded p-2 h-32 overflow-auto bg-blue-50">
                                {trackProjections[trackIndex].join('\n') || 'Projection empty'}
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <span className="text-xs text-gray-500">Live from service store</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
