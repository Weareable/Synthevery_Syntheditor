'use client'
import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface TrackDetailPanelProps {
    trackName: string
    className?: string
}

export function TrackDetailPanel({ trackName, className }: TrackDetailPanelProps) {
    const [loopLength, setLoopLength] = useState(16)
    const [selectedStep, setSelectedStep] = useState(16)

    const loopLengthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 12, 16, 24, 32, 48, 64, 128, 256]

    const handleLoopLengthChange = (direction: 'up' | 'down') => {
        const currentIndex = loopLengthOptions.indexOf(loopLength)
        if (direction === 'up' && currentIndex < loopLengthOptions.length - 1) {
            setLoopLength(loopLengthOptions[currentIndex + 1])
        } else if (direction === 'down' && currentIndex > 0) {
            setLoopLength(loopLengthOptions[currentIndex - 1])
        }
    }

    const handleStepClick = (step: number) => {
        setSelectedStep(step)
    }

    return (
        <div className={cn(
            "box-border content-stretch flex flex-col gap-2.5 h-[318px] items-start justify-start overflow-clip p-[10px] relative rounded-[5px] shrink-0 w-[250px]",
            className
        )}>
            <div className="basis-0 grow min-h-px min-w-px relative rounded-[5px] shrink-0 w-full">
                <div className="box-border content-stretch flex flex-col gap-5 items-center justify-center overflow-clip p-[10px] relative size-full">
                    {/* トラック名 */}
                    <div className="content-stretch flex flex-col gap-[5px] items-center justify-center relative shrink-0 w-full">
                        <div className="flex flex-col font-normal justify-center leading-[0] relative shrink-0 text-[12px] text-center text-nowrap text-white">
                            <p className="leading-[normal] whitespace-pre">{trackName}</p>
                        </div>
                        <div className="h-0 relative shrink-0 w-full">
                            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
                                <div className="w-full h-px bg-white/40"></div>
                            </div>
                        </div>
                    </div>

                    {/* ループ長選択 */}
                    <div className="content-stretch flex gap-2.5 h-[100px] items-center justify-start overflow-clip relative shrink-0 w-full">
                        <div className="content-stretch flex flex-col gap-2.5 h-full items-start justify-center overflow-clip relative shrink-0">
                            <div className="flex flex-col font-normal justify-center leading-[normal] relative shrink-0 text-[12px] text-[rgba(255,255,255,0.4)] text-nowrap whitespace-pre">
                                <p className="mb-0">LOOP</p>
                                <p className="">LENGTH</p>
                            </div>
                            <div className="h-[50px] relative rounded-[5px] shrink-0 w-[60px]">
                                <div className="box-border content-stretch flex h-[50px] items-center justify-between overflow-clip px-0.5 py-0 relative w-[60px]">
                                    <button
                                        onClick={() => handleLoopLengthChange('down')}
                                        className="relative shrink-0 size-2.5 text-white hover:text-white/80 transition-colors"
                                    >
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                            <path d="M6 4L4 6L2 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <div className="content-stretch flex gap-[5px] h-full items-center justify-start relative shrink-0">
                                        <div className="flex flex-col font-normal justify-center leading-[0] relative shrink-0 text-[0px] text-nowrap text-right text-white">
                                            <p className="leading-[normal] whitespace-pre">
                                                <span className="text-[12px]">{loopLength}</span>
                                                <span className="text-[12px] text-[rgba(255,255,255,0.4)]"> </span>
                                                <span className="font-normal text-[6px] text-[rgba(255,255,255,0.4)]">/ 16</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleLoopLengthChange('up')}
                                        className="relative shrink-0 size-2.5 text-white hover:text-white/80 transition-colors"
                                    >
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                            <path d="M4 2L6 4L4 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                                <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.16)] border-solid inset-0 pointer-events-none rounded-[5px]" />
                            </div>
                        </div>

                        {/* ステップグリッド */}
                        <div className="basis-0 gap-[5px] grid grid-cols-[repeat(4,_minmax(0px,_1fr))] grid-rows-[repeat(4,_minmax(0px,_1fr))] grow h-full min-h-px min-w-px overflow-clip relative shrink-0">
                            {loopLengthOptions.map((step, index) => (
                                <button
                                    key={step}
                                    onClick={() => handleStepClick(step)}
                                    className={cn(
                                        "box-border content-stretch flex flex-col gap-2.5 items-center justify-center overflow-clip p-[10px] relative shrink-0 transition-colors",
                                        selectedStep === step
                                            ? "bg-white/20"
                                            : "hover:bg-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "flex flex-col font-normal justify-center leading-[0] relative shrink-0 text-[0px] text-nowrap text-right",
                                        selectedStep === step ? "text-white" : "text-[rgba(255,255,255,0.4)]"
                                    )}>
                                        <p className="leading-[normal] whitespace-pre">
                                            <span className="text-[10px]">{step}</span>
                                            <span className="font-normal text-[6px]">/16</span>
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* シーケンス編集ボタン */}
                    <div className="content-stretch flex gap-2.5 items-start justify-start overflow-clip relative shrink-0 w-full">
                        <div className="basis-0 content-stretch flex flex-col gap-2.5 grow items-start justify-center min-h-px min-w-px overflow-clip relative self-stretch shrink-0">
                            <div className="flex flex-col font-normal justify-center leading-[normal] relative shrink-0 text-[12px] text-[rgba(255,255,255,0.4)] text-nowrap whitespace-pre">
                                <p className="mb-0">SEQ</p>
                                <p className="">EDIT</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-[50px] w-16 bg-transparent border-white/20 text-[#958538] hover:bg-white/10 hover:text-[#958538]"
                        >
                            ERASER
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-[50px] w-16 bg-transparent border-white/20 text-[#953838] hover:bg-white/10 hover:text-[#953838]"
                        >
                            CLEAR<br />ALL
                        </Button>
                    </div>
                </div>
                <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.16)] border-solid inset-0 pointer-events-none rounded-[5px]" />
            </div>
        </div>
    )
}
