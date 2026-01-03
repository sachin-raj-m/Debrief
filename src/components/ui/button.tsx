import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        // Default - white/light button
        default: "bg-primary text-primary-foreground hover:bg-primary/90",

        // Destructive
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/50",

        // Outline
        outline:
          "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",

        // Secondary - dark gray buttons
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",

        // Ghost
        ghost:
          "hover:bg-accent hover:text-accent-foreground",

        // Link
        link: "text-primary underline-offset-4 hover:underline",

        // ===================================
        // POLL-SPECIFIC VARIANTS
        // ===================================

        // Mint - primary action color (teal/green)
        mint: "bg-mint text-mint-foreground hover:bg-mint/90 hover:shadow-lg hover:shadow-mint/20",

        // Coral - highlight/CTA color (orange)
        coral: "bg-coral text-coral-foreground hover:bg-coral/90 hover:shadow-lg hover:shadow-coral/20",

        // Lime - accent color (yellow-green)
        lime: "bg-lime text-lime-foreground hover:bg-lime/90 hover:shadow-lg hover:shadow-lime/20",

        // Mint outline
        "mint-outline": "border-2 border-mint text-mint bg-transparent hover:bg-mint hover:text-mint-foreground",

        // Coral outline
        "coral-outline": "border-2 border-coral text-coral bg-transparent hover:bg-coral hover:text-coral-foreground",

        // Lime outline
        "lime-outline": "border-2 border-lime text-lime bg-transparent hover:bg-lime hover:text-lime-foreground",

        // Glass effect button
        glass: "glass border border-white/10 text-foreground hover:bg-white/10",

        // Tag style (for filter buttons like Hot, Best, Controversial)
        tag: "bg-secondary text-secondary-foreground hover:bg-secondary/70 text-label-sm",

        // Active tag
        "tag-active": "bg-primary text-primary-foreground text-label-sm",
      },
      size: {
        default: "h-10 px-5 py-2 text-sm rounded-lg",
        sm: "h-8 px-3 py-1.5 text-xs rounded-md",
        lg: "h-12 px-8 py-3 text-base rounded-lg",
        xl: "h-14 px-10 py-4 text-lg rounded-xl",
        icon: "size-10 rounded-lg",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-12 rounded-lg",

        // Pill variants - fully rounded
        pill: "h-10 px-6 py-2 text-sm rounded-full",
        "pill-sm": "h-8 px-4 py-1.5 text-xs rounded-full",
        "pill-lg": "h-12 px-8 py-3 text-base rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
