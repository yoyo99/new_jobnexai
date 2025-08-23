import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { MotionPreferences, KeyboardEventHandlers, screenReader } from '../lib/accessibility'

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  loadingText?: string
  children: ReactNode
  ariaLabel?: string
  ariaDescribedBy?: string
  announceOnClick?: string
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText = 'Loading...',
    children,
    ariaLabel,
    ariaDescribedBy,
    announceOnClick,
    onClick,
    disabled,
    className = '',
    ...props
  }, ref) => {
    const prefersReducedMotion = MotionPreferences.prefersReducedMotion()

    const baseClasses = `
      inline-flex items-center justify-center font-medium rounded-lg
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      relative
    `

    const variantClasses = {
      primary: `
        bg-blue-600 text-white hover:bg-blue-700 
        focus:ring-blue-500 active:bg-blue-800
      `,
      secondary: `
        bg-gray-600 text-white hover:bg-gray-700 
        focus:ring-gray-500 active:bg-gray-800
      `,
      danger: `
        bg-red-600 text-white hover:bg-red-700 
        focus:ring-red-500 active:bg-red-800
      `,
      ghost: `
        bg-transparent text-gray-700 hover:bg-gray-100 
        focus:ring-gray-500 active:bg-gray-200
        border border-gray-300
      `
    }

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    }

    const buttonClasses = `
      ${baseClasses}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return

      // Announce click action to screen readers
      if (announceOnClick) {
        screenReader.announce(announceOnClick)
      }

      onClick?.(event)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Handle Enter and Space keys for better accessibility
      KeyboardEventHandlers.handleEnterSpace(() => {
        if (!loading && !disabled) {
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          })
          event.currentTarget.dispatchEvent(clickEvent)
        }
      })(event.nativeEvent)

      props.onKeyDown?.(event)
    }

    const motionProps = prefersReducedMotion ? {} : {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
      transition: { duration: 0.1 }
    }

    // Separate motion props from HTML props to avoid type issues
    const { style, onKeyDown, ...htmlProps } = props

    return (
      <motion.button
        ref={ref}
        className={buttonClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...motionProps}
        {...(htmlProps as any)}
        style={style}
      >
        {loading && (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="sr-only">{loadingText}</span>
          </>
        )}
        
        <span className={loading ? 'opacity-0' : 'opacity-100'}>
          {children}
        </span>

        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            {loadingText}
          </span>
        )}
      </motion.button>
    )
  }
)

AccessibleButton.displayName = 'AccessibleButton'