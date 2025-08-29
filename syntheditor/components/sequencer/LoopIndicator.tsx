'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { motion, useMotionValue, useTransform } from 'framer-motion'

interface LoopIndicatorProps {
    currentStep: number
    totalSteps: number
    isPlaying?: boolean
    bpm?: number
    loopLengthMs?: number
    className?: string
}

export function LoopIndicator({
    currentStep,
    totalSteps,
    isPlaying = false,
    bpm = 120,
    loopLengthMs = 8000,
    className
}: LoopIndicatorProps) {
    const [currentTime, setCurrentTime] = useState(0)

    // 現在のステップ位置を0-1の範囲に正規化
    const progress = useMotionValue(currentStep / totalSteps)

    // 角度をラジアンに変換（上=0度、時計回り）
    const angleRad = useTransform(progress, [0, 1], [-Math.PI / 2, 3 * Math.PI / 2])

    // ドットの座標を計算
    const center = 50
    const radius = 40
    const dotRadius = 2

    const dotX = useTransform(angleRad, (rad) => center + radius * Math.cos(rad))
    const dotY = useTransform(angleRad, (rad) => center + radius * Math.sin(rad))

    // 進捗リング用のtransform
    const strokeDashoffset = useTransform(progress, p => 1 - p)

    // 進捗更新のコールバック
    const updateProgress = useCallback((newProgress: number) => {
        progress.set(newProgress)
    }, [progress])

    // 再生中の時間ベースのアニメーション
    useEffect(() => {
        if (!isPlaying) {
            setCurrentTime(0)
            return
        }

        const startTime = Date.now()
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime
            const loopProgress = (elapsed % loopLengthMs) / loopLengthMs
            setCurrentTime(loopProgress * loopLengthMs)

            // ステップベースの進捗も更新
            const stepProgress = Math.floor(loopProgress * totalSteps) / totalSteps
            updateProgress(stepProgress)
        }, 16) // 60fps

        return () => clearInterval(interval)
    }, [isPlaying, loopLengthMs, totalSteps, updateProgress])

    // ステップが変更されたときにprogressを更新
    useEffect(() => {
        if (!isPlaying) {
            updateProgress(currentStep / totalSteps)
        }
    }, [currentStep, totalSteps, isPlaying, updateProgress])

    return (
        <div className={cn('relative w-full h-full', className)}>
            <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* 背景リング */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="rgba(255,255,255,0.12)"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth={1.5}
                />

                {/* 進捗を示すリング（再生中のみ表示） */}
                {isPlaying && (
                    <motion.circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke="rgba(255,255,255,0.6)"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: progress.get() }}
                        style={{
                            pathLength: progress,
                            strokeDashoffset: strokeDashoffset
                        }}
                    />
                )}

                {/* 現在位置を示すドット */}
                <motion.circle
                    cx={dotX}
                    cy={dotY}
                    r={dotRadius}
                    fill="rgba(255,255,255,0.75)"
                    stroke="rgba(255,255,255,0.85)"
                    strokeWidth={0.5}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            </svg>

            {/* 再生中の視覚効果 */}
            {isPlaying && (
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-white/30"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            )}
        </div>
    )
}
