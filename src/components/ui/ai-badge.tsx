import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const aiBadgeVariants = cva(
  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "bg-neon-blue/10 border border-neon-blue/30 text-neon-blue",
        active:
          "bg-green-500/10 border border-green-500/30 text-green-400",
        warning:
          "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400",
        error:
          "bg-red-500/10 border border-red-500/30 text-red-400",
        gradient:
          "bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-500/30 text-primary-300",
        neon:
          "bg-transparent border-2 border-neon-purple text-neon-purple shadow-neon-purple",
      },
      size: {
        sm: "px-3 py-1 text-xs",
        default: "px-4 py-2 text-sm",
        lg: "px-5 py-2.5 text-base",
      },
      pulse: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      pulse: true,
    },
  }
)

interface AIBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof aiBadgeVariants> {
  icon?: React.ReactNode
}

export const AIBadge: React.FC<AIBadgeProps> = ({
  className,
  variant,
  size,
  pulse = true,
  icon,
  children,
  ...props
}) => {
  const pulseColor = {
    default: "bg-neon-blue",
    active: "bg-green-400",
    warning: "bg-yellow-400",
    error: "bg-red-400",
    gradient: "bg-primary-400",
    neon: "bg-neon-purple",
  }[variant || "default"]

  return (
    <div
      className={cn(aiBadgeVariants({ variant, size, className }))}
      {...props}
    >
      {pulse && (
        <span
          className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            pulseColor
          )}
        />
      )}
      {icon}
      {children}
    </div>
  )
}

export default AIBadge
