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
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [deltaX, setDeltaX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [isExiting, setIsExiting] = useState<'left' | 'right' | null>(null)

  const startXRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Reset state when card changes
  useEffect(() => {
    setIsFlipped(false)
    setDeltaX(0)
    setIsExiting(null)
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [card.id])

  // Stop speech on unmount
  useEffect(() => {
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation()
    const synth = window.speechSynthesis
    if (!synth) return
    if (isSpeaking) {
      synth.cancel()
      setIsSpeaking(false)
      return
    }
    const text = isFlipped ? card.backText : card.frontText
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    synth.speak(utterance)
    setIsSpeaking(true)
  }

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
            className="absolute inset-0 rounded-2xl bg-white flex flex-col items-center p-8 overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="absolute top-4 right-4">
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                ✓ {card.knownCount}/10
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4 shrink-0">
              Question
            </p>
            <div className="flex-1 flex items-center justify-center w-full">
              <div className="overflow-y-auto w-full" style={{ maxHeight: '220px' }}>
                <p className="text-2xl font-semibold text-gray-900 text-center leading-snug py-2">
                  {card.frontText}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 shrink-0">
              <p className="text-xs text-gray-400">Tap to reveal answer</p>
              <SpeakButton isSpeaking={isSpeaking} onClick={handleSpeak} />
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl bg-blue-50 flex flex-col items-center p-8 overflow-hidden"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="absolute top-4 right-4">
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                ✓ {card.knownCount}/10
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4 shrink-0">
              Answer
            </p>
            <div className="flex-1 flex items-center justify-center w-full">
              <div className="overflow-y-auto w-full" style={{ maxHeight: '220px' }}>
                <p className="text-2xl font-semibold text-gray-900 text-center leading-snug py-2">
                  {card.backText}
                </p>
              </div>
            </div>
            <div className="mt-4 shrink-0">
              <SpeakButton isSpeaking={isSpeaking} onClick={handleSpeak} />
            </div>
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

function SpeakButton({
  isSpeaking,
  onClick,
}: {
  isSpeaking: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className={`p-2 rounded-full transition ${isSpeaking ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
      aria-label={isSpeaking ? 'Stop reading' : 'Read aloud'}
      title={isSpeaking ? 'Stop' : 'Read aloud'}
    >
      {isSpeaking ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="4" height="12" rx="1" />
          <rect x="14" y="6" width="4" height="12" rx="1" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      )}
    </button>
  )
}
