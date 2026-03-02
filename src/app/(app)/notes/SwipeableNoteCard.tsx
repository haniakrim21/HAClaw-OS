'use client'

import { useRef, useState, useCallback } from 'react'

interface SwipeableNoteCardProps {
  children: React.ReactNode
  onSwipeLeft: () => void
  onSwipeRight: () => void
  leftLabel?: string
  rightLabel?: string
}

const THRESHOLD = 80

export function SwipeableNoteCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftLabel = 'Archive',
  rightLabel = 'Pin',
}: SwipeableNoteCardProps) {
  const startX = useRef(0)
  const [offsetX, setOffsetX] = useState(0)
  const [swiping, setSwiping] = useState(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    setSwiping(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping) return
    const dx = e.touches[0].clientX - startX.current
    // Limit the offset for resistance effect
    const clamped = Math.sign(dx) * Math.min(Math.abs(dx), 150)
    setOffsetX(clamped)
  }, [swiping])

  const handleTouchEnd = useCallback(() => {
    setSwiping(false)
    if (offsetX > THRESHOLD) {
      onSwipeRight()
    } else if (offsetX < -THRESHOLD) {
      onSwipeLeft()
    }
    setOffsetX(0)
  }, [offsetX, onSwipeLeft, onSwipeRight])

  return (
    <div className="relative overflow-hidden rounded-xl md:overflow-visible">
      {/* Swipe action backgrounds (mobile only) */}
      <div className="absolute inset-0 flex items-center justify-between px-4 md:hidden">
        <div className={`text-xs font-medium transition-opacity ${offsetX > 30 ? 'opacity-100' : 'opacity-0'}`} style={{ color: 'var(--warm)' }}>
          {rightLabel}
        </div>
        <div className={`text-xs font-medium transition-opacity ${offsetX < -30 ? 'opacity-100' : 'opacity-0'}`} style={{ color: 'var(--muted)' }}>
          {leftLabel}
        </div>
      </div>

      {/* Card content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: offsetX !== 0 ? `translateX(${offsetX}px)` : undefined,
          transition: swiping ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}
