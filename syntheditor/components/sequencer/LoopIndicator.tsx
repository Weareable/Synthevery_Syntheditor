'use client'
import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { motion, useMotionValue, useTransform } from 'framer-motion'

interface LoopIndicatorProps {
    progress: number
    currentStep: number
    totalSteps: number
    isPlaying?: boolean
    className?: string
}

export function LoopIndicator({
    progress,
    currentStep,
    totalSteps,
    isPlaying = false,
    className
}: LoopIndicatorProps) {
    // 0..1 の進捗をモーション値として保持
    const progressMv = useMotionValue(isPlaying ? progress : (totalSteps > 0 ? currentStep / totalSteps : 0))

    // 角度をラジアンに変換（上=0度、時計回り）
    const angleRad = useTransform(progressMv, [0, 1], [-Math.PI / 2, 3 * Math.PI / 2])

    // ドットの座標を計算
    const center = 50
    const radius = 40
    const dotRadius = 2

    const dotX = useTransform(angleRad, (rad) => center + radius * Math.cos(rad))
    const dotY = useTransform(angleRad, (rad) => center + radius * Math.sin(rad))

    // 進捗リング用のtransform
    const strokeDashoffset = useTransform(progressMv, p => 1 - p)
    // 進捗の同期: 再生中は連続値 progress、停止中はステップ基準
    useEffect(() => {
        const value = isPlaying ? progress : (totalSteps > 0 ? currentStep / totalSteps : 0)
        progressMv.set(value)
    }, [progress, currentStep, totalSteps, isPlaying, progressMv])

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
                    fill="var(--muted)"
                    stroke="var(--border)"
                    strokeWidth={1.5}
                />

                {/* 進捗を示すリング（再生中のみ表示） */}
                {isPlaying && (
                    <motion.circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke="var(--primary)"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        transform={`rotate(${-90} ${center} ${center})`}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: progressMv.get() }}
                        style={{
                            pathLength: progressMv,
                            strokeDashoffset: strokeDashoffset
                        }}
                    />
                )}

                {/* 現在位置を示すドット */}
                <motion.circle
                    cx={dotX}
                    cy={dotY}
                    r={dotRadius}
                    fill="var(--foreground)"
                    stroke="var(--foreground)"
                    strokeWidth={0.5}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            </svg>

            {/* 再生中の視覚効果 */}
            {isPlaying && (
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-border"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            )}
        </div>
    )
}
