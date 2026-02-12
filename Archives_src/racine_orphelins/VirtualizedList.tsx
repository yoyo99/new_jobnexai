import { useRef, useEffect, useState, memo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { LoadingSpinner } from './LoadingSpinner'

interface VirtualizedListProps<T> {
  items: T[]
  height: number
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  onEndReached?: () => void
  endReachedThreshold?: number
  loadingMore?: boolean
}

export function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  onEndReached,
  endReachedThreshold = 0.8,
  loadingMore = false,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [isNearEnd, setIsNearEnd] = useState(false)

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  })

  useEffect(() => {
    if (!onEndReached || !parentRef.current || isNearEnd || loadingMore) return

    const handleScroll = () => {
      if (!parentRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = parentRef.current
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

      if (scrollPercentage > endReachedThreshold) {
        setIsNearEnd(true)
        onEndReached()
      }
    }

    const element = parentRef.current
    element.addEventListener('scroll', handleScroll, { passive: true })
    return () => element.removeEventListener('scroll', handleScroll)
  }, [onEndReached, isNearEnd, endReachedThreshold, loadingMore])

  // Reset isNearEnd when items change
  useEffect(() => {
    setIsNearEnd(false)
  }, [items.length])

  const MemoizedItem = memo(({ index }: { index: number }) => {
    return renderItem(items[index], index)
  })

  return (
    <div
      ref={parentRef}
      style={{
        height,
        overflow: 'auto',
        position: 'relative',
        willChange: 'transform',
      }}
      className="scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${itemHeight}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <MemoizedItem index={virtualRow.index} />
          </div>
        ))}
      </div>
      
      {loadingMore && (
        <div className="py-4 flex justify-center">
          <LoadingSpinner size="md" text="Chargement..." />
        </div>
      )}
    </div>
  )
}