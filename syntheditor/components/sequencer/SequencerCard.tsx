'use client'
import React from 'react'
import { cn } from '@/lib/utils'

interface SequencerCardProps {
    trackNumber: number
    instrumentName: string
    isSelected?: boolean
    className?: string
    onClick?: () => void
}

export function SequencerCard({
    trackNumber,
    instrumentName,
    isSelected = false,
    className,
    onClick
}: SequencerCardProps) {
    return (
        <div
            className={cn(
                "box-border content-stretch flex flex-col items-center justify-start relative size-full cursor-pointer",
                className
            )}
            onClick={onClick}
        >
            <div className="basis-0 grow min-h-px min-w-px relative rounded shrink-0 w-full">
                <div className="box-border content-stretch flex flex-col gap-1 items-end justify-start overflow-visible p-2 relative size-full">
                    <div className="flex flex-col font-normal justify-center leading-[0] relative shrink-0 text-xs text-center text-white w-full">
                        <p className="leading-[normal]">{trackNumber}: {instrumentName}</p>
                    </div>
                    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full">
                        {/* ピアノアイコン */}
                        <div className="absolute bottom-[19.15%] overflow-visible top-[18.09%] translate-x-[-50%] w-[91px]" style={{ left: "calc(50% - 1px)" }}>
                            <div className="absolute aspect-[32/32] left-[24.14%] overflow-visible right-[24.83%] translate-y-[-50%]" style={{ top: "calc(50% + 0.186px)" }}>
                                <div className="absolute contents inset-[9.38%_6.25%]">
                                    {/* ピアノの鍵盤を表現するSVG要素 */}
                                    <div className="absolute bottom-[9.38%] left-3/4 right-[6.25%] top-[9.38%]">
                                        <div className="absolute inset-[-1.33%_-5.74%]" style={{ "--stroke-0": "rgba(255, 255, 255, 0.4)" } as React.CSSProperties}>
                                            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none">
                                                <rect x="0" y="0" width="32" height="32" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="absolute inset-[9.38%_53.13%_9.38%_31.25%]">
                                        <div className="absolute inset-[-1.33%_-6.89%]" style={{ "--stroke-0": "rgba(255, 255, 255, 0.4)" } as React.CSSProperties}>
                                            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none">
                                                <rect x="0" y="0" width="32" height="32" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="absolute inset-[9.38%_31.25%_9.38%_53.13%]">
                                        <div className="absolute inset-[-1.33%_-6.89%]" style={{ "--stroke-0": "rgba(255, 255, 255, 0.4)" } as React.CSSProperties}>
                                            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none">
                                                <rect x="0" y="0" width="32" height="32" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-[9.38%] left-[6.25%] right-3/4 top-[9.38%]">
                                        <div className="absolute inset-[-1.33%_-5.74%]" style={{ "--stroke-0": "rgba(255, 255, 255, 0.4)" } as React.CSSProperties}>
                                            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none">
                                                <rect x="0" y="0" width="32" height="32" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 中央の円形要素 */}
                        <div className="absolute aspect-[80/80] bottom-[7.45%] top-[7.45%] translate-x-[-50%]" style={{ left: "calc(50% - 0.5px)" }}>
                            <div className="w-full h-full rounded-full bg-white/20 border border-white/40"></div>
                        </div>

                        {/* 上部の小さな円形要素 */}
                        <div className="absolute bottom-[86.17%] top-[1.06%] translate-x-[-50%] w-3" style={{ left: "calc(50% - 0.5px)" }}>
                            <div className="w-full h-full rounded-full bg-white/20 border border-white/40"></div>
                        </div>
                    </div>
                </div>
                <div
                    aria-hidden="true"
                    className={cn(
                        "absolute border border-white/20 border-solid inset-0 pointer-events-none rounded",
                        isSelected
                            ? "border-2 border-white"
                            : "border border-[rgba(255,255,255,0.16)]"
                    )}
                />
            </div>
        </div>
    )
}
