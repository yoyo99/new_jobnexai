import * as React from "react"
import { cn } from "@/lib/utils"

interface AITypingIndicatorProps {
  className?: string
  text?: string
}

export const AITypingIndicator: React.FC<AITypingIndicatorProps> = ({
  className,
  text = "AI is thinking",
}) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex gap-1 px-4 py-3 bg-primary-500/10 rounded-2xl">
        <span
          className="w-2 h-2 bg-neon-blue rounded-full animate-[typing_1.4s_ease-in-out_infinite]"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 bg-neon-blue rounded-full animate-[typing_1.4s_ease-in-out_infinite]"
          style={{ animationDelay: '200ms' }}
        />
        <span
          className="w-2 h-2 bg-neon-blue rounded-full animate-[typing_1.4s_ease-in-out_infinite]"
          style={{ animationDelay: '400ms' }}
        />
      </div>
      {text && (
        <span className="text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  )
}

export default AITypingIndicator
