'use client'

import { useState, useRef, useEffect } from 'react'
import { Flashcard } from '@/lib/types'

interface SwipeCardProps {
  card: Flashcard
  onSwipe: (direction: 'left' | 'right') => void
}

const SWIPE_THRESHOLD = 100
const TAP_THRESHOLD = 10

export function SwipeCard({ card, onSwipe }: SwipeCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [deltaX, setDeltaX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [isExiting, setIsExiting] = useState<'left' | 'right' | null>(null)

  const startXRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false)
    setDeltaX(0)
    setIsExiting(null)
  }, [card.id])

  // Prevent page scroll during swipe
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const preventScroll = (e: TouchEvent) => {
      if (isDraggingRef.current) e.preventDefault()
    }
    el.addEventListener('touchmove', preventScroll, { passive: false })
    return () => el.removeEventListener('touchmove', preventScroll)
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    startXRef.current = e.clientX
    isDraggingRef.current = false
    setIsSwiping(false)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startXRef.current === null || isExiting) return
    const dx = e.clientX - startXRef.current
    if (Math.abs(dx) > TAP_THRESHOLD) {
      isDraggingRef.current = true
      setIsSwiping(true)
    }
    if (isDraggingRef.current) {
      setDeltaX(dx)
    }
  }

  const handlePointerUp = () => {
    if (startXRef.current === null) return

    if (!isDraggingRef.current) {
      // Tap — flip the card
      setIsFlipped((prev) => !prev)
    } else if (deltaX > SWIPE_THRESHOLD) {
      triggerSwipe('right')
    } else if (deltaX < -SWIPE_THRESHOLD) {
      triggerSwipe('left')
    } else {
      // Snap back
      setDeltaX(0)
    }

    startXRef.current = null
    isDraggingRef.current = false
    setIsSwiping(false)
  }

  const triggerSwipe = (direction: 'left' | 'right') => {
    setIsExiting(direction)
    setDeltaX(direction === 'right' ? 600 : -600)
    setTimeout(() => onSwipe(direction), 300)
  }

  const rotation = deltaX * 0.05
  const showKnow = deltaX > 30
  const showSkip = deltaX < -30

  const cardStyle: React.CSSProperties = {
    transform: `translateX(${deltaX}px) rotate(${rotation}deg)`,
    transition: isExiting
      ? 'transform 0.3s ease-out'
      : isSwiping
        ? 'none'
        : 'transform 0.2s ease-out',
    cursor: isSwiping ? 'grabbing' : 'grab',
    touchAction: 'none',
  }

  return (
    <div
      ref={cardRef}
      className="relative w-full max-w-sm mx-auto select-none"
      style={{ perspective: '1000px' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Card */}
      <div
        className="relative w-full"
        style={{
          ...cardStyle,
          height: '400px',
        }}
      >
        {/* Inner card with flip */}
        <div
          className="absolute inset-0 rounded-2xl shadow-2xl"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.4s ease',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl bg-white flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
              Question
            </p>
            <p className="text-2xl font-semibold text-gray-900 text-center leading-snug">
              {card.frontText}
            </p>
            <p className="text-xs text-gray-400 mt-8">Tap to reveal answer</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl bg-blue-50 flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4">
              Answer
            </p>
            <p className="text-2xl font-semibold text-gray-900 text-center leading-snug">
              {card.backText}
            </p>
          </div>
        </div>

        {/* KNOW overlay */}
        {showKnow && (
          <div
            className="absolute inset-0 rounded-2xl flex items-center justify-center pointer-events-none z-10"
            style={{ opacity: Math.min(Math.abs(deltaX) / SWIPE_THRESHOLD, 1) }}
          >
            <div className="border-4 border-green-500 rounded-xl px-6 py-2 rotate-[-15deg]">
              <span className="text-3xl font-extrabold text-green-500 tracking-widest">
                KNOW
              </span>
            </div>
          </div>
        )}

        {/* SKIP overlay */}
        {showSkip && (
          <div
            className="absolute inset-0 rounded-2xl flex items-center justify-center pointer-events-none z-10"
            style={{ opacity: Math.min(Math.abs(deltaX) / SWIPE_THRESHOLD, 1) }}
          >
            <div className="border-4 border-red-500 rounded-xl px-6 py-2 rotate-[15deg]">
              <span className="text-3xl font-extrabold text-red-500 tracking-widest">
                SKIP
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
