'use client'
import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DraggableNumberInput } from '@/components/ui/draggable-number-input'
import { SoloButton } from './SoloButton'
import useDeviceControl from '@/hooks/useDeviceControl'

interface TrackDetailPanelProps {
    tracks: Track[]
    selectedTrack: number | null
    onTrackSelect: (trackId: number) => void
    trackName: string
    className?: string
}

interface Track {
    id: number
    name: string
    instrument: string
}

export function TrackDetailPanel({ tracks, selectedTrack, onTrackSelect, trackName, className }: TrackDetailPanelProps) {
    const [loopLength, setLoopLength] = useState(16)
    const [selectedStep, setSelectedStep] = useState(16)
    const { resetTrack } = useDeviceControl()

    const loopLengthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 12, 16, 24, 32, 48, 64, 128, 256]

    const handleLoopLengthChange = (value: number) => {
        setLoopLength(value)
    }

    const handleStepClick = (step: number) => {
        setSelectedStep(step)
        setLoopLength(step)
    }

    // ソロボタンのハンドラー（将来的にSequencerCardGroupと連携）
    const handleSoloClick = () => {
        console.log('Solo button clicked for track:', trackName)
        // TODO: SequencerCardGroupとの連携を実装
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
                        <div className="content-stretch flex gap-[5px] items-center justify-center relative shrink-0">
                            <button
                                onClick={() => {
                                    const currentIndex = tracks.findIndex(t => t.id === selectedTrack)
                                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1
                                    onTrackSelect(tracks[prevIndex].id)
                                }}
                                className="relative shrink-0 size-6 cursor-pointer hover:opacity-80 transition-opacity"
                                aria-label="Previous track"
                            >
                                <div className="absolute inset-[29.17%_41.67%_29.17%_37.5%]">
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                        <path d="M6.5 2.5L3.5 5L6.5 7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </button>
                            <div className="flex flex-col font-normal justify-center leading-[0] relative shrink-0 text-[12px] text-center text-nowrap text-white">
                                <p className="leading-[normal] whitespace-pre">{trackName}</p>
                            </div>
                            <button
                                onClick={() => {
                                    const currentIndex = tracks.findIndex(t => t.id === selectedTrack)
                                    const nextIndex = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0
                                    onTrackSelect(tracks[nextIndex].id)
                                }}
                                className="relative shrink-0 size-6 cursor-pointer hover:opacity-80 transition-opacity"
                                aria-label="Next track"
                            >
                                <div className="absolute inset-[29.17%_37.5%_29.17%_41.67%]">
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                        <path d="M3.5 2.5L6.5 5L3.5 7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </button>
                        </div>
                        <div className="h-0 relative shrink-0 w-full">
                            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
                                <div className="w-full h-px bg-border"></div>
                            </div>
                        </div>
                    </div>

                    {/* ループ長選択 */}
                    <div className="content-stretch flex gap-2 h-24 items-center justify-start overflow-visible relative shrink-0 w-full">
                        <div className="content-stretch flex flex-col gap-4 h-full items-start justify-center overflow-visible relative shrink-0">
                            <div className="flex flex-col font-normal justify-center leading-[normal] relative shrink-0 text-xs text-muted-foreground text-nowrap whitespace-pre">
                                <p className="mb-0">LOOP</p>
                                <p className="">LENGTH</p>
                            </div>

                            {/* DraggableNumberInput コンポーネント */}
                            <div className="h-10 relative rounded shrink-0 w-15">
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
                                    className="h-10 w-15 bg-transparent border-border text-foreground"
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
                                            ? "bg-accent"
                                            : "hover:bg-accent/50"
                                    )}
                                >
                                    <div className={cn(
                                        "flex flex-col font-normal justify-center leading-[0] relative shrink-0 text-xs text-nowrap text-right",
                                        selectedStep === step ? "text-foreground" : "text-muted-foreground"
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
                            <div className="flex flex-col font-normal justify-center relative shrink-0 text-xs text-muted-foreground text-nowrap whitespace-pre">
                                <p className="mb-0">SEQ</p>
                                <p className="mt-0">EDIT</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <SoloButton
                                trackId={1} // TODO: 実際のトラックIDを取得
                                isActive={false} // TODO: 実際のソロ状態を取得
                                onClick={handleSoloClick}
                                className="h-12 w-16"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-12 w-16 bg-transparent border-border text-accent-foreground hover:bg-accent/50 hover:text-accent-foreground"
                            >
                                ERASER
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-12 w-16 bg-transparent border-border text-destructive hover:bg-accent/50 hover:text-destructive"
                                onClick={() => {
                                    if (selectedTrack != null) {
                                        resetTrack(selectedTrack)
                                    }
                                }}
                            >
                                CLEAR<br />ALL
                            </Button>
                        </div>
                    </div>
                </div>
                <div aria-hidden="true" className="absolute border border-border border-solid inset-0 pointer-events-none rounded" />
            </div>
        </div>
    )
}
