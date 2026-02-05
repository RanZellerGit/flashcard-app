'use client'

import { Flashcard } from '@/lib/types'

interface ExitConfirmationModalProps {
  isOpen: boolean
  deckName: string
  currentCardIndex: number
  totalCards: number
  onResume: () => void
  onExit: () => void
}

/**
 * T043: ExitConfirmationModal for confirming exit from study mode
 */
export function ExitConfirmationModal({
  isOpen,
  deckName,
  currentCardIndex,
  totalCards,
  onResume,
  onExit,
}: ExitConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Exit Study Mode?</h2>
        <p className="text-gray-600 mb-4">
          You're on card {currentCardIndex + 1} of {totalCards} in <strong>{deckName}</strong>
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            Your progress will be saved. You can resume from where you left off next time.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onResume}
            className="flex-1 px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition"
          >
            Keep Studying
          </button>
          <button
            onClick={onExit}
            className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  )
}
