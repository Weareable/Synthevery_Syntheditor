import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const oneshotButtonVariants = cva(
  "w-10 h-10 rounded-sm border-r-1 border-l-1 flex items-center justify-center text-sm transition-transform duration-200 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-transparent text-primary-foreground border-border hover:bg-accent hover:text-accent-foreground transition-colors duration-300",
        clicked: "bg-foreground/30 border-foreground",
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

function OneshotButton({
  className,
  variant,
  size,
  asChild = false,
  onClick,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof oneshotButtonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"
  const [isClicked, setIsClicked] = React.useState(false)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 20)
    onClick?.(e)
  }

  return (
    <Comp
      data-slot="button"
      className={cn(oneshotButtonVariants({
        variant: isClicked ? "clicked" : variant,
        size,
        className
      }))}
      onClick={handleClick}
      {...props}
    />
  )
}

export { OneshotButton, oneshotButtonVariants }
