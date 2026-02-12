import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
  text?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'primary-400',
  className = '',
  text
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`rounded-full border-t-2 border-b-2 border-${color} ${sizeMap[size]}`}
      />
      {text && (
        <p className="mt-2 text-gray-400 text-sm">{text}</p>
      )}
    </div>
  )
}