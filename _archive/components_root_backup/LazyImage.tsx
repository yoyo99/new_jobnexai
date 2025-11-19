import { useState, useEffect, useRef, memo, useMemo } from 'react'
import { motion } from 'framer-motion'

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  placeholderColor?: string
  sizes?: string
  srcSet?: string
  priority?: boolean
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

// Generate WebP/AVIF versions if available
const generateSrcSet = (src: string): string => {
  if (!src) return ''
  
  const basePath = src.split('.').slice(0, -1).join('.')
  
  // For optimization, we would typically have multiple sizes
  // This is a simplified version - in production, you'd have server-side image processing
  return [
    `${basePath}_640w.webp 640w`,
    `${basePath}_1024w.webp 1024w`,
    `${basePath}_1920w.webp 1920w`,
    `${src} 2000w` // Fallback to original
  ].join(', ')
}

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholderColor = '#1f2937',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  srcSet,
  priority = false,
  objectFit = 'cover'
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority) // Load immediately if priority
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Memoize srcSet generation
  const optimizedSrcSet = useMemo(() => {
    return srcSet || generateSrcSet(src)
  }, [src, srcSet])

  useEffect(() => {
    if (priority) return // Skip intersection observer for priority images

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true)
          observer.disconnect() // Disconnect after first intersection
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [priority])

  useEffect(() => {
    if (!isInView || isLoaded) return

    const img = new Image()
    
    // Use srcSet if available for better performance
    if (optimizedSrcSet) {
      img.srcset = optimizedSrcSet
      img.sizes = sizes
    }
    
    img.src = src
    img.onload = () => setIsLoaded(true)
    img.onerror = () => setError(true)

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src, isInView, isLoaded, optimizedSrcSet, sizes])

  return (
    <div
      ref={imgRef}
      style={{
        width: width || '100%',
        height: height || 'auto',
        backgroundColor: isLoaded ? 'transparent' : placeholderColor,
        position: 'relative',
        overflow: 'hidden',
        transition: 'background-color 0.3s ease'
      }}
      className={className}
      role="img"
      aria-label={alt}
    >
      {/* Placeholder skeleton */}
      {!isLoaded && !error && isInView && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      )}
      
      {isInView && (
        <>
          {error ? (
            <div 
              className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs bg-gray-100"
            >
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          ) : (
            <motion.img
              src={src}
              srcSet={optimizedSrcSet}
              sizes={sizes}
              alt={alt}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ 
                opacity: isLoaded ? 1 : 0,
                scale: isLoaded ? 1 : 1.05
              }}
              transition={{ 
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit,
              }}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={() => setIsLoaded(true)}
              onError={() => setError(true)}
            />
          )}
        </>
      )}
    </div>
  )
})