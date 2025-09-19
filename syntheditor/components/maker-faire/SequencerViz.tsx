'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { useSynthevery } from '@/contexts/SyntheveryContext'
import { useAppState } from '@/hooks/useAppState'
import useTickClock from '@/hooks/useTickClock'
import type { TrackState } from '@/lib/synthevery-core/types/player'

interface MockNote { tick: number; color: string }
interface TrackViz { color: string; loopLengthTick: number; notes: MockNote[] }

function generateMockNotes(ticks: number, color: string, count: number): MockNote[] {
    return Array.from({ length: count }).map((_, i) => ({
        tick: Math.floor((i + 1) * (ticks / (count + 1))),
        color,
    }))
}

export function SequencerViz({ bpm = 120 }: { bpm?: number }) {
    const canvasRef = useRef<SVGSVGElement | null>(null)
    const { playerSyncStates } = useSynthevery()
    const [trackStates] = useAppState<TrackState[]>(playerSyncStates.trackStates)
    const { tick, isRunning } = useTickClock()
    const tickRef = useRef(0)
    useEffect(() => { tickRef.current = tick }, [tick])

    // パン・ズーム状態を永続化
    const panZoomRef = useRef({
        scale: 1,
        translateX: 0,
        translateY: 0,
        initialized: false
    })

    // パレット（トラック数に応じて循環）
    const palette = ['#e11d48', '#0ea5e9', '#22c55e', '#a78bfa', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6']

    const tracks: TrackViz[] = useMemo(() => {
        if (!Array.isArray(trackStates) || trackStates.length === 0) return []
        return trackStates.map((ts, idx) => {
            const color = palette[idx % palette.length]
            const ticks = Math.max(120, ts.loopLengthTick || 1920)
            return {
                color,
                loopLengthTick: ticks,
                notes: generateMockNotes(ticks, color, 5),
            }
        })
    }, [trackStates])

    useEffect(() => {
        const svg = canvasRef.current
        if (!svg) return
        let raf = 0
        const start = performance.now()
        // pan/zoom state (useRefから取得)
        const panZoom = panZoomRef.current
        let isDragging = false
        let dragStartX = 0
        let dragStartY = 0

        const render = () => {
            // tickClockに同期（最新tickはrefから取得）
            const currentTick = tickRef.current
            const box = svg.getBoundingClientRect()
            const w = box.width, h = box.height
            const paddingRight = 0
            const maxR = Math.min((w - paddingRight) / 2, h * 0.45)
            // 1920tick の基準半径（トラック構成に依存しない）
            const baseR1920 = Math.min(maxR - 12, h * 0.40)
            const visualEpsilon = 2 // 視覚上のクリッピング対策
            const cxMax = w - paddingRight - maxR + visualEpsilon
            const cy = h * 0.5
            let scene = svg.querySelector('g#scene') as SVGGElement | null
            if (!scene) {
                scene = document.createElementNS('http://www.w3.org/2000/svg', 'g')
                scene.setAttribute('id', 'scene')
                svg.appendChild(scene)
            }
            let g = scene.querySelector('g#viz') as SVGGElement | null
            if (!g) {
                g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
                g.setAttribute('id', 'viz')
                scene.appendChild(g)
            }
            g.innerHTML = ''

            // 角速度統一: 1小節=1920tick基準で計算
            const ticksPerSecond = (bpm / 60) * 480 // 1秒あたりのティック数
            const addCircle = (cx_: number, r: number, color: string) => {
                const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
                c.setAttribute('cx', String(cx_))
                c.setAttribute('cy', String(cy))
                c.setAttribute('r', String(r))
                c.setAttribute('fill', 'none')
                c.setAttribute('stroke', color)
                c.setAttribute('stroke-width', '2')
                g.appendChild(c)
            }
            const addDot = (x: number, y: number, color: string) => {
                const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
                c.setAttribute('cx', String(x))
                c.setAttribute('cy', String(y))
                c.setAttribute('r', '5')
                c.setAttribute('fill', color)
                g.appendChild(c)
            }
            const addDash = (x1: number, y1: number, x2: number, y2: number) => {
                const l = document.createElementNS('http://www.w3.org/2000/svg', 'line')
                l.setAttribute('x1', String(x1))
                l.setAttribute('y1', String(y1))
                l.setAttribute('x2', String(x2))
                l.setAttribute('y2', String(y2))
                l.setAttribute('stroke', '#94a3b8')
                l.setAttribute('stroke-width', '1')
                l.setAttribute('stroke-dasharray', '3 6')
                g.appendChild(l)
            }

            // 円の半径: トラック構成に依存しない比例（1920tick を基準）
            const maxLoop = Math.max(...tracks.map(tr => tr.loopLengthTick)) || 1920

            tracks.forEach((track) => {
                const r = (track.loopLengthTick / 1920) * baseR1920
                const cx = w - paddingRight - r + visualEpsilon // 右端に接するように各円の中心を調整
                addCircle(cx, r, '#334155')

                // 角速度統一: BPM による周速度一定（ω = 2π * TPS / loopLengthTick）
                const theta = (2 * Math.PI) * ((currentTick % track.loopLengthTick) / track.loopLengthTick)
                const cos = Math.cos, sin = Math.sin

                // 1 beat ごとの点線（放射線の短いダッシュ）
                const beats = Math.max(1, Math.round(track.loopLengthTick / 480))
                for (let b = 0; b < beats; b++) {
                    const a = (2 * Math.PI) * (b / beats) + theta
                    const x1 = cx + (r - 8) * Math.cos(a)
                    const y1 = cy + (r - 8) * Math.sin(a)
                    const x2 = cx + (r + 8) * Math.cos(a)
                    const y2 = cy + (r + 8) * Math.sin(a)
                    addDash(x1, y1, x2, y2)
                }

                // notes
                track.notes.forEach(n => {
                    const noteAngle = ((n.tick % track.loopLengthTick) / track.loopLengthTick) * Math.PI * 2
                    const currentAngle = noteAngle + theta
                    const x = cx + r * cos(currentAngle)
                    const y = cy + r * sin(currentAngle)
                    addDot(x, y, track.color)
                })
            })

            // center dash line
            const dash = document.createElementNS('http://www.w3.org/2000/svg', 'line')
            dash.setAttribute('x1', '0')
            dash.setAttribute('x2', String(w))
            dash.setAttribute('y1', String(cy))
            dash.setAttribute('y2', String(cy))
            dash.setAttribute('stroke', '#64748b')
            dash.setAttribute('stroke-width', '2')
            dash.setAttribute('stroke-dasharray', '8 8')
            g.appendChild(dash)

            // 初期表示: 右端が中央、かつ 1920tick の円がしっかり収まるスケールに
            if (!panZoom.initialized) {
                const r1920 = baseR1920
                const fitScaleX = w / (4 * r1920) // 横: 左半分に直径が収まる
                const fitScaleY = (h / 2) / r1920   // 縦: r <= h/2
                const baseScale = Math.min(fitScaleX, fitScaleY)
                const targetScale = Math.min(1, Math.max(0.1, baseScale * 0.98))
                panZoom.scale = targetScale
                // 右端(シーン座標の w) を 2/3 * w に合わせる
                panZoom.translateX = (2 / 3) * w - (panZoom.scale * w)
                panZoom.translateY = (h / 2) - (panZoom.scale * (h / 2))
                panZoom.initialized = true
            }

            // apply pan/zoom transform to the scene
            scene.setAttribute('transform', `translate(${panZoom.translateX}, ${panZoom.translateY}) scale(${panZoom.scale})`)

            raf = requestAnimationFrame(render)
        }

        raf = requestAnimationFrame(render)

        // interactions
        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            const rect = svg.getBoundingClientRect()
            const cx = e.clientX - rect.left
            const cy = e.clientY - rect.top
            const intensity = 0.003 // 感度を約2倍に
            const delta = -e.deltaY * intensity
            const nextScale = Math.min(3, Math.max(0.25, panZoom.scale * (1 + delta))) // さらに縮小可
            const k = nextScale / panZoom.scale
            panZoom.translateX = cx - k * (cx - panZoom.translateX)
            panZoom.translateY = cy - k * (cy - panZoom.translateY)
            panZoom.scale = nextScale
        }
        const onPointerDown = (e: PointerEvent) => {
            isDragging = true
            dragStartX = e.clientX - panZoom.translateX
            dragStartY = e.clientY - panZoom.translateY
                ; (svg as any).setPointerCapture?.(e.pointerId)
        }
        const onPointerMove = (e: PointerEvent) => {
            if (!isDragging) return
            panZoom.translateX = e.clientX - dragStartX
            panZoom.translateY = e.clientY - dragStartY
        }
        const onPointerUp = (e: PointerEvent) => {
            isDragging = false
                ; (svg as any).releasePointerCapture?.(e.pointerId)
        }
        const onDblClick = () => {
            const rect = svg.getBoundingClientRect()
            const w = rect.width, h = rect.height
            const paddingRight = 0
            const maxR = Math.min((w - paddingRight) / 2, h * 0.45)
            const baseR1920 = Math.min(maxR - 12, h * 0.40)
            const r1920 = baseR1920
            const fitScaleX = w / (4 * r1920)
            const fitScaleY = (h / 2) / r1920
            const baseScale = Math.min(fitScaleX, fitScaleY)
            const targetScale = Math.min(1, Math.max(0.1, baseScale * 0.98))
            panZoom.scale = targetScale
            // 右端(シーン座標の w) を 2/3 * w に合わせる
            panZoom.translateX = (2 / 3) * w - (panZoom.scale * w)
            panZoom.translateY = (h / 2) - (panZoom.scale * (h / 2))
        }

        svg.addEventListener('wheel', onWheel, { passive: false })
        svg.addEventListener('pointerdown', onPointerDown)
        svg.addEventListener('pointermove', onPointerMove)
        svg.addEventListener('pointerup', onPointerUp)
        svg.addEventListener('dblclick', onDblClick)

        return () => {
            cancelAnimationFrame(raf)
            svg.removeEventListener('wheel', onWheel)
            svg.removeEventListener('pointerdown', onPointerDown)
            svg.removeEventListener('pointermove', onPointerMove)
            svg.removeEventListener('pointerup', onPointerUp)
            svg.removeEventListener('dblclick', onDblClick)
        }
    }, [tracks, bpm]) // tracks依存を復活

    return (
        <svg ref={canvasRef} className="w-full h-full touch-none" role="img" aria-label="Sequencer visualization">
            <g id="scene">
                <g id="viz" />
            </g>
        </svg>
    )
}


