'use client'
import React from 'react'
import { cn } from '@/lib/utils'

interface SoloButtonProps {
    trackId: number
    isActive: boolean
    onClick: () => void
    className?: string
}

export function SoloButton({
    trackId,
    isActive,
    onClick,
    className
}: SoloButtonProps) {
    return (
        <div className={cn(
            "h-6 relative rounded-[5px] shrink-0 w-full",
            className
        )}>
            <button
                onClick={onClick}
                className={cn(
                    "box-border content-stretch flex flex-col gap-[5px] h-6 items-center justify-center overflow-clip px-2.5 py-0 relative w-full cursor-pointer transition-all",
                    isActive
                        ? "bg-accent text-accent-foreground"
                        : "bg-transparent text-muted-foreground hover:bg-accent/50"
                )}
            >
                <div className={cn(
                    "flex flex-col font-normal justify-center leading-[0] relative shrink-0 text-[12px] text-center text-nowrap",
                    isActive ? "text-accent-foreground" : "text-muted-foreground"
                )}>
                    <p className="leading-[normal] whitespace-pre">SOLO</p>
                </div>
            </button>
            <div
                aria-hidden="true"
                className={cn(
                    "absolute border border-solid inset-0 pointer-events-none rounded-[5px]",
                    isActive
                        ? "border-2 border-primary"
                        : "border border-border"
                )}
            />
        </div>
    )
}
