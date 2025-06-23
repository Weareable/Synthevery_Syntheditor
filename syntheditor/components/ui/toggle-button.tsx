'use client'
import React from 'react'
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const toggleButtonVariants = cva(
    "w-10 h-10 rounded-sm border-1 flex items-center justify-center text-sm transition-all duration-200",
    {
        variants: {
            variant: {
                default: "bg-transparent text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground border-b-3 data-[state=on]:bg-transparent data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:border-t-3 data-[state=on]:border-b-1",
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

export function ToggleButton({
    className,
    variant,
    size,
    ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleButtonVariants>) {
    return (
        <TogglePrimitive.Root
            data-slot="toggle-button"
            className={cn(toggleButtonVariants({ variant, size, className }))}
            {...props}
        />
    )
} 