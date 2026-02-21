import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "./card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  trend?: {
    value: string
    isPositive: boolean
  }
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  trend,
  className,
}) => {
  return (
    <Card variant="glass" className={cn("p-6 relative", className)}>
      {/* Icon with gradient border */}
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 relative">
        <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-primary-500 via-secondary-500 to-pink-500">
          <div className="w-full h-full rounded-2xl bg-card" />
        </div>
        <div className="relative z-10 text-primary-400">
          {icon}
        </div>
      </div>

      {/* Value with gradient text */}
      <div className="text-4xl font-bold font-['Space_Grotesk'] bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-secondary-400 to-pink-400 leading-none mb-2">
        {value}
      </div>

      {/* Label */}
      <div className="text-muted-foreground text-sm">
        {label}
      </div>

      {/* Trend indicator */}
      {trend && (
        <div
          className={cn(
            "absolute top-6 right-6 flex items-center gap-1 text-sm px-2.5 py-1 rounded-lg",
            trend.isPositive
              ? "text-green-400 bg-green-400/10"
              : "text-red-400 bg-red-400/10"
          )}
        >
          {trend.isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {trend.value}
        </div>
      )}
    </Card>
  )
}

export default StatCard
