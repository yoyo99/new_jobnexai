import * as React from "react"
import { cn } from "@/lib/utils"
import { MessageCircle, X, Sparkles } from "lucide-react"

interface AIChatFabProps {
  onClick?: () => void
  isOpen?: boolean
  className?: string
}

export const AIChatFab: React.FC<AIChatFabProps> = ({
  onClick,
  isOpen = false,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "w-16 h-16 rounded-full",
        "bg-gradient-to-br from-primary-500 via-secondary-500 to-pink-500",
        "flex items-center justify-center",
        "shadow-glow cursor-pointer",
        "transition-all duration-300 ease-out",
        "hover:scale-110 hover:shadow-neon-purple",
        "animate-float",
        "focus:outline-none focus:ring-4 focus:ring-primary-500/50",
        className
      )}
      aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
    >
      <div className="relative">
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <>
            <MessageCircle className="w-7 h-7 text-white" />
            <Sparkles className="w-4 h-4 text-white absolute -top-1 -right-1 animate-pulse" />
          </>
        )}
      </div>

      {/* Pulse ring effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 animate-ping opacity-20" />
    </button>
  )
}

export default AIChatFab
