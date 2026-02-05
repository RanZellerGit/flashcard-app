'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Deck } from '@/lib/types'

interface DeckCardProps {
  deck: Deck
  onDelete?: (deckId: string) => Promise<void>
}

/**
 * T029: DeckCard component for displaying individual deck in grid
 */
export function DeckCard({ deck, onDelete }: DeckCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleStudy = () => {
    router.push(`/deck/${deck.id}/study`)
  }

  const handleManage = () => {
    router.push(`/deck/${deck.id}`)
  }

  const handleDelete = async () => {
    if (!onDelete) return

    if (
      !confirm(
        `Are you sure you want to delete "${deck.name}"? This cannot be undone.`
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete(deck.id)
    } catch (error) {
      console.error('Failed to delete deck:', error)
      alert('Failed to delete deck. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden">
      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex-1 break-words">
            {deck.name}
          </h3>
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="ml-2 px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition disabled:opacity-50"
              title="Delete deck"
            >
              ✕
            </button>
          )}
        </div>

        {/* Card Count */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-gray-600">
            {deck.cardCount} card{deck.cardCount !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(deck.createdDate).toLocaleDateString()}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all"
            style={{ width: `${Math.min(100, (deck.cardCount / 10) * 100)}%` }}
          />
        </div>
      </div>

      {/* Card Footer - Action Buttons */}
      <div className="px-6 pb-6 flex gap-3">
        <button
          onClick={handleManage}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
        >
          Manage
        </button>
        <button
          onClick={handleStudy}
          disabled={deck.cardCount === 0}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            deck.cardCount === 0
              ? 'Add cards to this deck before studying'
              : 'Start studying this deck'
          }
        >
          {deck.cardCount === 0 ? 'No Cards' : 'Study'}
        </button>
      </div>
    </div>
  )
}
