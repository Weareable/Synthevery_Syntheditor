import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const verticalDividerVariants = cva(
    "w-[2px] bg-border rounded-[1px]",
    {
        variants: {
            size: {
                default: "h-4",
                sm: "h-3",
                lg: "h-10",
                full: "h-full",
            },
            variant: {
                default: "bg-border",
                muted: "bg-muted",
                primary: "bg-primary/20",
                secondary: "bg-secondary",
                background: "bg-background",
            },
        },
        defaultVariants: {
            size: "default",
            variant: "default",
        },
    }
)

interface VerticalDividerProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof verticalDividerVariants> {
    orientation?: "vertical"
}

const VerticalDivider = React.forwardRef<HTMLDivElement, VerticalDividerProps>(
    ({ className, size, variant, orientation = "vertical", ...props }, ref) => {
        return (
            <div
                ref={ref}
                role="separator"
                aria-orientation={orientation}
                className={cn(verticalDividerVariants({ size, variant, className }))}
                {...props}
            />
        )
    }
)

VerticalDivider.displayName = "VerticalDivider"

export { VerticalDivider, verticalDividerVariants }
