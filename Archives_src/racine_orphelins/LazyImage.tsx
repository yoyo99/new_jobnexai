import { useState, useEffect, useRef, memo } from 'react'
import { motion } from 'framer-motion'

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  placeholderColor?: string
}

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholderColor = '#1f2937',
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
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
      if (imgRef.current) {
        observer.unobserve(imgRef.current)
      }
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!isInView || isLoaded) return

    const img = new Image()
    img.src = src
    img.onload = () => setIsLoaded(true)
    img.onerror = () => setError(true)

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src, isInView, isLoaded])

  return (
    <div
      ref={imgRef}
      style={{
        width: width || '100%',
        height: height || 'auto',
        backgroundColor: placeholderColor,
        position: 'relative',
        overflow: 'hidden',
      }}
      className={className}
      role="img"
      aria-label={alt}
    >
      {isInView && (
        <>
          {error ? (
            <div 
              className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs"
              style={{ backgroundColor: placeholderColor }}
            >
              Image non disponible
            </div>
          ) : (
            <motion.img
              src={src}
              alt={alt}
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoaded ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              loading="lazy"
            />
          )}
        </>
      )}
    </div>
  )
})