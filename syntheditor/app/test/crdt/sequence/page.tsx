"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { syntheveryServiceContainer } from '@/lib/synthevery-core/service-container';
import { NoteOrSet } from '@/lib/crdt/orset';
import { setupCrdtSync } from '@/lib/app/crdt-bootstrap';
import { ScoreEditor } from '@/lib/crdt/score-bridge';

const NUM_TRACKS = 8; // 8トラック対応

function useScoreEditor() {
    const [ops, setOps] = useState<string[]>([]);
    const editor = useMemo<ScoreEditor>(() => ({
        clearAll: () => setOps(prev => [...prev, 'clear']),
        removeInstrumentInRange: (c, n, s, e) => setOps(prev => [...prev, `ri:${c}:${n}:${s}-${e}`]),
        removeEffectInRange: (c, id, s, e) => setOps(prev => [...prev, `re:${c}:${id}:${s}-${e}`]),
        addInstrument: (c, n, t, v) => setOps(prev => [...prev, `ai:${c}:${n}:${t}:${v}`]),
        addEffect: (c, id, t, val) => setOps(prev => [...prev, `ae:${c}:${id}:${t}:${val}`]),
    }), []);
    return { editor, ops, setOps };
}

function useMultiTrackScoreEditors() {
    const [trackOps, setTrackOps] = useState<string[][]>(Array(NUM_TRACKS).fill(null).map(() => []));
    const editors = useMemo<ScoreEditor[]>(() => {
        return Array(NUM_TRACKS).fill(null).map((_, trackIndex) => ({
            clearAll: () => setTrackOps(prev => {
                const newOps = [...prev];
                newOps[trackIndex] = [...newOps[trackIndex], 'clear'];
                return newOps;
            }),
            removeInstrumentInRange: (c, n, s, e) => setTrackOps(prev => {
                const newOps = [...prev];
                newOps[trackIndex] = [...newOps[trackIndex], `ri:${c}:${n}:${s}-${e}`];
                return newOps;
            }),
            removeEffectInRange: (c, id, s, e) => setTrackOps(prev => {
                const newOps = [...prev];
                newOps[trackIndex] = [...newOps[trackIndex], `re:${c}:${id}:${s}-${e}`];
                return newOps;
            }),
            addInstrument: (c, n, t, v) => setTrackOps(prev => {
                const newOps = [...prev];
                newOps[trackIndex] = [...newOps[trackIndex], `ai:${c}:${n}:${t}:${v}`];
                return newOps;
            }),
            addEffect: (c, id, t, val) => setTrackOps(prev => {
                const newOps = [...prev];
                newOps[trackIndex] = [...newOps[trackIndex], `ae:${c}:${id}:${t}:${val}`];
                return newOps;
            }),
        }));
    }, []);
    return { editors, trackOps, setTrackOps };
}

export default function Page() {
    const servicesRef = useRef(syntheveryServiceContainer.initialize());
    const setRef = useRef(Array(NUM_TRACKS).fill(null).map(() => new NoteOrSet()));
    const { editors, trackOps, setTrackOps } = useMultiTrackScoreEditors();
    const [tick, setTick] = useState(0);
    const [connecting, setConnecting] = useState(false);
    const [peers, setPeers] = useState<string[]>([]);
    const [trackProjections, setTrackProjections] = useState<string[][]>(Array(NUM_TRACKS).fill(null).map(() => []));

    useEffect(() => {
        const services = servicesRef.current;
        const api = setupCrdtSync(services, editors, setRef.current);
        // subscribe mesh events to list peers
        const mesh = services.mesh as any;
        const onChanged = (devices: any) => {
            setPeers((devices || []).map((d: any) => Array.from<number>(d.address as Iterable<number>).map(b => b.toString(16).padStart(2, '0')).reverse().join(':')));
        };
        mesh.eventEmitter.on('connectedDevicesChanged', onChanged);
        const timer = setInterval(() => {
            setTick(prev => {
                const t = prev + 1;
                api.onTick(t);
                // compute projection list lines for each track
                try {
                    const newProjections = api.sets.map((set, trackIndex) => {
                        const notes = set.buildFullProjection();
                        return notes.map(n => {
                            const kind = n.type === 0 ? 'INST' : 'EFF';
                            const ch = n.pos.channel;
                            const key = n.pos.key;
                            const tickStr = n.pos.tick;
                            if (n.type === 0) {
                                const vel = (n.payload as any).velocity;
                                return `${kind} c=${ch} n=${key} t=${tickStr} v=${vel}`;
                            } else {
                                const val = (n.payload as any).value;
                                return `${kind} c=${ch} id=${key} t=${tickStr} val=${val}`;
                            }
                        });
                    });
                    setTrackProjections(newProjections);
                } catch (_e) {
                    // ignore
                }
                return t;
            });
        }, 200);
        return () => clearInterval(timer);
    }, [editors]);

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
                <button className="px-2 py-1 border rounded" onClick={() => setTrackOps(Array(NUM_TRACKS).fill(null).map(() => []))}>Clear All Views</button>
            </div>
            <div className="text-xs text-gray-600">Peers: {peers.join(', ') || 'none'}</div>

            {/* トラックごとの表示 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array(NUM_TRACKS).fill(null).map((_, trackIndex) => (
                    <div key={trackIndex} className="border rounded p-3 space-y-2">
                        <h3 className="text-sm font-semibold">Track {trackIndex}</h3>

                        <div>
                            <h4 className="text-xs font-medium text-gray-600 mb-1">Operations</h4>
                            <div className="text-xs whitespace-pre-wrap border rounded p-2 h-32 overflow-auto bg-gray-50">
                                {trackOps[trackIndex].join('\n') || 'No ops yet.'}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-medium text-gray-600 mb-1">Projection</h4>
                            <div className="text-xs whitespace-pre-wrap border rounded p-2 h-32 overflow-auto bg-blue-50">
                                {trackProjections[trackIndex].join('\n') || 'Projection empty'}
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <button
                                className="px-2 py-1 text-xs border rounded bg-gray-100 hover:bg-gray-200"
                                onClick={() => {
                                    setTrackOps(prev => {
                                        const newOps = [...prev];
                                        newOps[trackIndex] = [];
                                        return newOps;
                                    });
                                }}
                            >
                                Clear Track {trackIndex}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
