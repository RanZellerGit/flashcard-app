'use client'

import { useState, useEffect, useRef } from 'react'
import { Flashcard } from '@/lib/types'
import { getRandomCards, markCardAsKnown } from '@/lib/storage'
import { incrementCardsViewedToday } from '@/lib/dailyStats'
import { SwipeCard } from './SwipeCard'

interface SwipeModeProps {
  userId: string
  onExit: () => void
}

export function SwipeMode({ userId, onExit }: SwipeModeProps) {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [knownCount, setKnownCount] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cardsRef = useRef<Flashcard[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const fetched = await getRandomCards()
        setCards(fetched)
        cardsRef.current = fetched
      } catch {
        setError('Failed to load cards. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isCompleted || cardsRef.current.length === 0) return
      switch (e.code) {
        case 'ArrowRight':
          handleSwipe('right')
          break
        case 'ArrowLeft':
          handleSwipe('left')
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isCompleted])

  const handleSwipe = async (direction: 'left' | 'right') => {
    const current = cardsRef.current[0]
    if (!current) return

    const remaining = cardsRef.current.slice(1)
    cardsRef.current = remaining
    setCards(remaining)
    incrementCardsViewedToday()

    if (direction === 'right') {
      setKnownCount((prev) => prev + 1)
      try {
        await markCardAsKnown(current.id, userId)
      } catch {
        // Non-critical: card stays unknown but session continues
        console.error('Failed to mark card as known:', current.id)
      }
    }

    if (remaining.length === 0) {
      setIsCompleted(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading cards...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={onExit}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (cards.length === 0 && !isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🎓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h2>
          <p className="text-gray-600 mb-6">
            You've marked all your cards as known. Add more cards to your decks to keep
            practicing.
          </p>
          <button
            onClick={onExit}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Session Complete!</h2>
          <p className="text-gray-600 mb-2">
            You swiped{' '}
            <span className="font-semibold text-green-600">{knownCount}</span> card
            {knownCount !== 1 ? 's' : ''} as known.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Cards disappear permanently after 10 correct swipes.
          </p>
          <button
            onClick={onExit}
            className="w-full px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const currentCard = cards[0]
  const remaining = cards.length

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onExit}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium transition"
          >
            ← Exit
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">{remaining} cards left</p>
          </div>
          <div className="w-16" />
        </div>

        {/* Action hints */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-1 text-red-500">
            <span className="text-lg">←</span>
            <span className="text-xs font-medium">Skip</span>
          </div>
          <p className="text-xs text-gray-400">Tap to flip</p>
          <div className="flex items-center gap-1 text-green-500">
            <span className="text-xs font-medium">Know</span>
            <span className="text-lg">→</span>
          </div>
        </div>

        {/* Card */}
        <SwipeCard key={currentCard.id} card={currentCard} onSwipe={handleSwipe} />

        {/* Button controls */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => handleSwipe('left')}
            className="flex-1 py-3 bg-white border-2 border-red-200 text-red-500 font-semibold rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-2"
          >
            <span className="text-xl">✕</span> Skip
          </button>
          <button
            onClick={() => handleSwipe('right')}
            className="flex-1 py-3 bg-white border-2 border-green-200 text-green-600 font-semibold rounded-xl hover:bg-green-50 transition flex items-center justify-center gap-2"
          >
            <span className="text-xl">✓</span> Know
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Keyboard: ← Skip &nbsp;|&nbsp; → Know
        </p>
      </div>
    </div>
  )
}
