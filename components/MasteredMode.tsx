'use client'

import { useState, useEffect, useRef } from 'react'
import { Flashcard } from '@/lib/types'
import { getMasteredCards, resetCardToUnknown } from '@/lib/storage'
import { SwipeCard } from './SwipeCard'
import { incrementCardsViewedToday } from '@/lib/dailyStats'

interface MasteredModeProps {
  userId: string
  onExit: () => void
}

export function MasteredMode({ userId, onExit }: MasteredModeProps) {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [forgotCount, setForgotCount] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cardsRef = useRef<Flashcard[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const fetched = await getMasteredCards()
        setCards(fetched)
        cardsRef.current = fetched
      } catch {
        setError('Failed to load mastered cards. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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

    if (direction === 'left') {
      setForgotCount((prev) => prev + 1)
      try {
        await resetCardToUnknown(current.id)
      } catch {
        console.error('Failed to reset card:', current.id)
      }
    }
    // right = still know → do nothing

    if (remaining.length === 0) {
      setIsCompleted(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading mastered cards...</p>
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
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No mastered cards yet</h2>
          <p className="text-gray-600 mb-6">
            Cards appear here after you swipe them as known 10 times in Practice mode.
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
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Review Complete!</h2>
          {forgotCount > 0 ? (
            <p className="text-gray-600 mb-2">
              <span className="font-semibold text-red-500">{forgotCount}</span> card
              {forgotCount !== 1 ? 's' : ''} moved back to practice.
            </p>
          ) : (
            <p className="text-gray-600 mb-2">You still know all your mastered cards!</p>
          )}
          <p className="text-sm text-gray-500 mb-8">
            Cards you forgot will need 10 correct swipes again to master.
          </p>
          <button
            onClick={onExit}
            className="w-full px-6 py-3 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition"
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
            <p className="text-xs font-medium text-yellow-600 uppercase tracking-wide mb-0.5">
              Mastered Review
            </p>
            <p className="text-sm font-semibold text-gray-700">{remaining} cards left</p>
          </div>
          <div className="w-16" />
        </div>

        {/* Action hints */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-1 text-red-500">
            <span className="text-lg">←</span>
            <span className="text-xs font-medium">Forgot</span>
          </div>
          <p className="text-xs text-gray-400">Tap to flip</p>
          <div className="flex items-center gap-1 text-green-500">
            <span className="text-xs font-medium">Still know</span>
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
            <span className="text-xl">✕</span> Forgot
          </button>
          <button
            onClick={() => handleSwipe('right')}
            className="flex-1 py-3 bg-white border-2 border-green-200 text-green-600 font-semibold rounded-xl hover:bg-green-50 transition flex items-center justify-center gap-2"
          >
            <span className="text-xl">✓</span> Still know
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Keyboard: ← Forgot &nbsp;|&nbsp; → Still know
        </p>
      </div>
    </div>
  )
}
