import * as React from "react"
import { cn } from "@/lib/utils"

interface AIProgressRingProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  className?: string
  showValue?: boolean
  label?: string
  animated?: boolean
}

export const AIProgressRing: React.FC<AIProgressRingProps> = ({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  showValue = true,
  label,
  animated = true,
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id="ai-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d9ff" />
            <stop offset="50%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-primary-500/20"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ai-ring-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? circumference : offset}
          className={cn(
            "transition-all duration-1000 ease-out",
            animated && "animate-[progress-ring_1s_ease-out_forwards]"
          )}
          style={{
            '--progress-offset': offset,
          } as React.CSSProperties}
        />
      </svg>

      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold font-['Space_Grotesk'] bg-clip-text text-transparent bg-gradient-to-r from-neon-blue via-primary-400 to-secondary-400">
            {value}
          </span>
          <span className="text-sm text-muted-foreground">%</span>
          {label && (
            <span className="text-xs text-muted-foreground mt-1">{label}</span>
          )}
        </div>
      )}

      <style>{`
        @keyframes progress-ring {
          from {
            stroke-dashoffset: ${circumference};
          }
          to {
            stroke-dashoffset: ${offset};
          }
        }
      `}</style>
    </div>
  )
}

export default AIProgressRing
