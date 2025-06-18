'use client'
import React, { useState } from 'react'
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const toggleButtonVariants = cva(
    "w-10 h-10 rounded-sm border-1 flex items-center justify-center text-sm transition-all duration-200",
    {
        variants: {
            variant: {
                default: "bg-transparent text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground border-b-3",
                active: "bg-transparent text-primary-foreground border-primary border-t-3",
            },
            size: {
                default: "w-10 h-10",
                sm: "w-8 h-8 text-xs",
                lg: "w-12 h-12 text-base",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

interface ToggleButtonProps extends VariantProps<typeof toggleButtonVariants> {
    label?: string;
    defaultActive?: boolean;
    active?: boolean;
    onToggle?: (isActive: boolean) => void;
    className?: string;
    asChild?: boolean;
}

export function ToggleButton({
    label = 'M',
    defaultActive = false,
    active,
    onToggle,
    className = '',
    variant,
    size,
    asChild = false,
    children,
    ...props
}: ToggleButtonProps & React.ComponentProps<"button">) {
    const isControlled = active !== undefined;
    const [internalActive, setInternalActive] = useState(defaultActive);
    const isActive = isControlled ? active : internalActive;
    const Comp = asChild ? Slot : "button"

    const handleToggle = () => {
        const newState = !isActive;
        if (!isControlled) setInternalActive(newState);
        onToggle?.(newState);
    }

    return (
        <Comp
            onClick={handleToggle}
            className={cn(
                toggleButtonVariants({
                    variant: isActive ? "active" : "default",
                    size,
                    className
                })
            )}
            aria-pressed={isActive}
            {...props}
        >
            {children || label}
        </Comp>
    )
} 