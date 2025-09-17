import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const panelVariants = cva(
    "flex rounded-lg bg-card text-card-foreground",
    {
        variants: {
            variant: {
                default: "bg-card",
                secondary: "bg-secondary/50",
                ghost: "bg-transparent border-none shadow-none",
            },
            padding: {
                default: "p-4",
                sm: "p-2",
                lg: "p-6",
                none: "p-0",
            },
        },
        defaultVariants: {
            variant: "default",
            padding: "default",
        },
    }
)

interface PanelProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelVariants> { }

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
    ({ className, variant, padding, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(panelVariants({ variant, padding, className }))}
                {...props}
            />
        )
    }
)
Panel.displayName = "Panel"

export { Panel, panelVariants }
