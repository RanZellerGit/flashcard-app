'use client'

import { useState, useEffect, useRef } from 'react'
import { Flashcard } from '@/lib/types'
import { StudyCard } from './StudyCard'
import { ExitConfirmationModal } from './ExitConfirmationModal'
import { useSession } from '@/lib/context/SessionContext'

interface StudyModeProps {
  deckId: string
  deckName: string
  cards: Flashcard[]
  onExit: () => void
}

/**
 * T038: StudyMode component for managing study session
 */
export function StudyMode({
  deckId,
  deckName,
  cards,
  onExit,
}: StudyModeProps) {
  const { session, setStudySession } = useSession()
  const [cardIndex, setCardIndex] = useState(
    session.currentStudySession?.deckId === deckId
      ? session.currentStudySession?.cardIndex ?? 0
      : 0
  )
  const [isFlipped, setIsFlipped] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const cardsLengthRef = useRef(cards.length)

  // Update ref when cards change
  useEffect(() => {
    cardsLengthRef.current = cards.length
  }, [cards.length])

  // Save session progress when card index changes
  useEffect(() => {
    if (cardIndex < cards.length) {
      setStudySession({
        deckId,
        cardIndex,
        isFlipped,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardIndex])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const maxIndex = cardsLengthRef.current - 1
      switch (e.code) {
        case 'Space':
        case 'Enter':
          e.preventDefault()
          setIsFlipped(prev => !prev)
          break
        case 'ArrowRight':
          setCardIndex(prev => (prev < maxIndex ? prev + 1 : prev))
          setIsFlipped(false)
          setIsCompleted(false)
          break
        case 'ArrowLeft':
          setCardIndex(prev => (prev > 0 ? prev - 1 : prev))
          setIsFlipped(false)
          setIsCompleted(false)
          break
        case 'Escape':
          handleExitClick()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const goToPrevious = () => {
    if (cardIndex > 0) {
      setCardIndex(cardIndex - 1)
      setIsFlipped(false)
      setIsCompleted(false)
    }
  }

  const goToNext = () => {
    if (cardIndex < cards.length - 1) {
      setCardIndex(cardIndex + 1)
      setIsFlipped(false)
      setIsCompleted(false)
    } else {
      setIsCompleted(true)
    }
  }

  const handleExitClick = () => {
    setShowExitConfirm(true)
  }

  const handleConfirmExit = async () => {
    await setStudySession(undefined)
    onExit()
  }

  const handleResumeStudy = () => {
    setShowExitConfirm(false)
  }

  const restart = () => {
    setCardIndex(0)
    setIsFlipped(false)
    setIsCompleted(false)
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Cards Yet
          </h2>
          <p className="text-gray-600 mb-6">
            Add cards to this deck to start studying
          </p>
          <button
            onClick={handleExitClick}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Back to Deck
          </button>
        </div>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Study Complete!
          </h2>
          <p className="text-gray-600 mb-8">
            You've reviewed all {cards.length} card{cards.length !== 1 ? 's' : ''} in this deck.
          </p>
          <div className="flex gap-3">
            <button
              onClick={restart}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Review Again
            </button>
            <button
              onClick={handleExitClick}
              className="flex-1 px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentCard = cards[cardIndex]

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8 hidden sm:block">
          <button
            onClick={handleExitClick}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4"
            aria-label="Exit study mode and return to deck"
          >
            ← Back to Deck
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{deckName}</h1>
          <p className="text-gray-600 mt-2">Study Mode</p>
        </div>

        {/* Mobile Header */}
        <div className="mb-6 sm:hidden flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 truncate">{deckName}</h1>
          </div>
          <button
            onClick={handleExitClick}
            className="ml-4 p-2 text-blue-600 hover:text-blue-700 transition"
            aria-label="Exit study mode"
          >
            ✕
          </button>
        </div>

        {/* Study Card */}
        <StudyCard
          card={currentCard}
          cardIndex={cardIndex}
          cardCount={cards.length}
          onFlip={() => setIsFlipped(!isFlipped)}
        />

        {/* Navigation Controls */}
        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <button
            onClick={goToPrevious}
            disabled={cardIndex === 0}
            className="w-full sm:flex-1 px-4 sm:px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous card"
          >
            ← Previous
          </button>

          <div className="px-4 sm:px-6 py-3 bg-white rounded-lg border border-gray-300 font-medium text-gray-900 whitespace-nowrap">
            {cardIndex + 1} / {cards.length}
          </div>

          <button
            onClick={goToNext}
            className="w-full sm:flex-1 px-4 sm:px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
            aria-label={cardIndex === cards.length - 1 ? 'Finish study session' : 'Next card'}
          >
            {cardIndex === cards.length - 1 ? 'Finish' : 'Next'} →
          </button>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Keyboard shortcuts: Space to flip • ← → to navigate • Esc to exit</p>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      <ExitConfirmationModal
        isOpen={showExitConfirm}
        deckName={deckName}
        currentCardIndex={cardIndex}
        totalCards={cards.length}
        onResume={handleResumeStudy}
        onExit={handleConfirmExit}
      />
    </div>
  )
}
