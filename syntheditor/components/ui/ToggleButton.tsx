'use client'
import React, { useState } from 'react'

interface ToggleButtonProps {
    label?: string;
    defaultActive?: boolean;
    onToggle?: (isActive: boolean) => void;
    className?: string;
}

export function ToggleButton({
    label = 'M',
    defaultActive = false,
    onToggle,
    className = ''
}: ToggleButtonProps) {
    const [isActive, setIsActive] = useState(defaultActive)

    const handleToggle = () => {
        const newState = !isActive
        setIsActive(newState)
        onToggle?.(newState)
    }

    return (
        <button
            onClick={handleToggle}
            className={`w-16 h-16 rounded-lg border-1 flex items-center justify-center font-bold text-lg transition-all duration-200 ${isActive
                ? 'bg-transparent text-primary-foreground border-primary border-t-3'
                : 'bg-transparent text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground border-b-3'
                } ${className}`}
        >
            {label}
        </button>
    )
} 