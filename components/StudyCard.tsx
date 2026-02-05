'use client'

import { useState, useEffect } from 'react'
import { Flashcard } from '@/lib/types'

interface StudyCardProps {
  card: Flashcard
  cardIndex: number
  cardCount: number
  onFlip?: () => void
}

/**
 * T037: StudyCard component for displaying flashcard with flip animation
 */
export function StudyCard({
  card,
  cardIndex,
  cardCount,
  onFlip,
}: StudyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false)
  }, [card.id])

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
    onFlip?.()
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      {/* Progress Indicator */}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-600" role="status" aria-live="polite">
          Card {cardIndex + 1} of {cardCount}
        </p>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={cardIndex + 1} aria-valuemin={1} aria-valuemax={cardCount}>
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-300"
            style={{
              width: `${((cardIndex + 1) / cardCount) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Card Display */}
      <button
        onClick={handleFlip}
        onKeyDown={(e) => {
          if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault()
            handleFlip()
          }
        }}
        className="cursor-pointer perspective min-h-64 sm:min-h-80 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-2xl transition-all"
        style={{
          perspective: '1000px',
        }}
        aria-label={`Flashcard, ${isFlipped ? 'showing answer:' : 'showing question:'} ${isFlipped ? card.backText : card.frontText}`}
      >
        <div
          className="w-full h-64 sm:h-80 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg transition-transform duration-500 flex items-center justify-center p-6 sm:p-8 border-2 border-blue-200 hover:shadow-xl"
          style={{
            transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(360deg)',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="text-center w-full">
            <p className="text-xs font-semibold text-blue-600 mb-4 uppercase tracking-wide">
              {isFlipped ? 'Answer' : 'Question'}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 break-words max-h-40 overflow-y-auto">
              {isFlipped ? card.backText : card.frontText}
            </p>
          </div>
        </div>
      </button>

      {/* Flip Hint */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Click card or press Space to {isFlipped ? 'show question' : 'reveal answer'}
        </p>
      </div>

      {/* Card State Indicator */}
      <div className="flex justify-center gap-2">
        <div
          className={`px-4 py-1 rounded-full text-xs font-medium ${
            isFlipped
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {isFlipped ? 'Answer Revealed' : 'Question'}
        </div>
      </div>
    </div>
  )
}
