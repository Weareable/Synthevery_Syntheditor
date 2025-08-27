'use client'
import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DraggableNumberInput } from '@/components/ui/draggable-number-input'

interface TrackDetailPanelProps {
    trackName: string
    className?: string
}

export function TrackDetailPanel({ trackName, className }: TrackDetailPanelProps) {
    const [loopLength, setLoopLength] = useState(16)
    const [selectedStep, setSelectedStep] = useState(16)

    const loopLengthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 12, 16, 24, 32, 48, 64, 128, 256]

    const handleLoopLengthChange = (value: number) => {
        setLoopLength(value)
    }

    const handleStepClick = (step: number) => {
        setSelectedStep(step)
        setLoopLength(step)
    }

    return (
        <div className={cn(
            "basis-0 box-border content-stretch flex flex-col gap-2.5 grow h-full items-start justify-start overflow-visible p-2 relative rounded min-h-px min-w-px",
            className
        )}>
            <div className="basis-0 grow min-h-px min-w-px relative rounded shrink-0 w-full">
                <div className="box-border content-stretch flex flex-col gap-5 items-center justify-center overflow-visible p-2 relative size-full">
                    {/* トラック名 */}
                    <div className="content-stretch flex flex-col gap-1 items-center justify-center relative shrink-0 w-full">
                        <div className="flex flex-col font-normal justify-center leading-[0] relative shrink-0 text-xs text-center text-nowrap text-white">
                            <p className="leading-[normal] whitespace-pre">{trackName}</p>
                        </div>
                        <div className="h-0 relative shrink-0 w-full">
                            <div className="absolute bottom-0 left-0 right-0 top-0">
                                <div className="w-full h-px bg-white/40"></div>
                            </div>
                        </div>
                    </div>

                    {/* ループ長選択 */}
                    <div className="content-stretch flex gap-1 h-24 items-center justify-start overflow-visible relative shrink-0 w-full">
                        <div className="content-stretch flex flex-col gap-2.5 h-full items-start justify-center overflow-visible relative shrink-0">
                            <div className="flex flex-col font-normal justify-center leading-[normal] relative shrink-0 text-xs text-[rgba(255,255,255,0.4)] text-nowrap whitespace-pre">
                                <p className="mb-0">LOOP</p>
                                <p className="">LENGTH</p>
                            </div>

                            {/* DraggableNumberInput コンポーネント */}
                            <div className="h-12 relative rounded shrink-0 w-20">
                                <DraggableNumberInput
                                    min={1}
                                    max={256}
                                    value={loopLength}
                                    onValueChange={handleLoopLengthChange}
                                    label=""
                                    step={1}
                                    dragSensitivity={0.5}
                                    showPopup={true}
                                    popupLabel="LOOP LENGTH"
                                    className="h-12 w-20 bg-transparent border-white/20 text-white"
                                    size="sm"
                                />
                            </div>
                        </div>

                        {/* ステップグリッド */}
                        <div className="basis-0 gap-1 grid grid-cols-[repeat(4,_minmax(0px,_1fr))] grid-rows-[repeat(4,_minmax(0px,_1fr))] grow h-full min-h-px min-w-px overflow-visible relative shrink-0">
                            {loopLengthOptions.map((step, index) => (
                                <button
                                    key={step}
                                    onClick={() => handleStepClick(step)}
                                    className={cn(
                                        "box-border content-stretch flex flex-col gap-2.5 items-center justify-center overflow-visible p-2 relative shrink-0 transition-colors",
                                        selectedStep === step
                                            ? "bg-white/20"
                                            : "hover:bg-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "flex flex-col font-normal justify-center leading-[0] relative shrink-0 text-xs text-nowrap text-right",
                                        selectedStep === step ? "text-white" : "text-[rgba(255,255,255,0.4)]"
                                    )}>
                                        <p className="leading-[normal] whitespace-pre">
                                            <span className="text-xs">{step}</span>
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* シーケンス編集ボタン */}
                    <div className="content-stretch flex gap-2.5 items-start justify-start overflow-visible relative shrink-0 w-full">
                        <div className="basis-0 content-stretch flex flex-col gap-2.5 grow items-start justify-center min-h-px min-w-px overflow-visible relative self-stretch shrink-0">
                            <div className="flex flex-col font-normal justify-center relative shrink-0 text-xs text-[rgba(255,255,255,0.4)] text-nowrap whitespace-pre">
                                <p className="mb-0">SEQ</p>
                                <p className="mt-0">EDIT</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-12 w-16 bg-transparent border-white/20 text-[#958538] hover:bg-white/10 hover:text-[#958538]"
                        >
                            ERASER
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-12 w-16 bg-transparent border-white/20 text-[#953838] hover:bg-white/10 hover:text-[#953838]"
                        >
                            CLEAR<br />ALL
                        </Button>
                    </div>
                </div>
                <div aria-hidden="true" className="absolute border border-white/20 border-solid inset-0 pointer-events-none rounded" />
            </div>
        </div>
    )
}
