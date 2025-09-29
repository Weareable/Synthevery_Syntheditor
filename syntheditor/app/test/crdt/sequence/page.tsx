"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { syntheveryServiceContainer } from '@/lib/synthevery-core/service-container';
import { NoteOrSet } from '@/lib/crdt/orset';
import { setupCrdtSync } from '@/lib/app/crdt-bootstrap';
import { ScoreEditor } from '@/lib/crdt/score-bridge';

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

export default function Page() {
    const servicesRef = useRef(syntheveryServiceContainer.initialize());
    const setRef = useRef(new NoteOrSet());
    const { editor, ops, setOps } = useScoreEditor();
    const [tick, setTick] = useState(0);
    const [connecting, setConnecting] = useState(false);
    const [peers, setPeers] = useState<string[]>([]);
    const [projection, setProjection] = useState<string[]>([]);

    useEffect(() => {
        const services = servicesRef.current;
        const api = setupCrdtSync(services, editor, setRef.current);
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
                // compute projection list lines
                try {
                    const notes = api.set.buildFullProjection();
                    const lines = notes.map(n => {
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
                    setProjection(lines);
                } catch (_e) {
                    // ignore
                }
                return t;
            });
        }, 200);
        return () => clearInterval(timer);
    }, [editor]);

    return (
        <div className="p-4 space-y-3">
            <h2 className="text-lg font-bold">CRDT Sequence Test</h2>
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
                <button className="px-2 py-1 border rounded" onClick={() => setOps([])}>Clear View</button>
            </div>
            <div className="text-xs text-gray-600">Peers: {peers.join(', ') || 'none'}</div>
            <div className="text-xs whitespace-pre-wrap border rounded p-2 h-64 overflow-auto">
                {ops.join('\n') || 'No ops yet. Perform actions on device to send deltas/full state.'}
            </div>
            <div>
                <h3 className="text-sm font-semibold mt-2">Projection</h3>
                <div className="text-xs whitespace-pre-wrap border rounded p-2 h-64 overflow-auto">
                    {projection.join('\n') || 'Projection empty'}
                </div>
            </div>
        </div>
    );
}
