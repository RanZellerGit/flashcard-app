'use client'

import { Flashcard } from '@/lib/types'
import { normalizeCardText } from '@/lib/utils'

interface DeckCardsListProps {
  cards: Flashcard[]
  loading?: boolean
  onEditCard?: (card: Flashcard) => void
  onDeleteCard?: (cardId: string) => void
}

/**
 * T024: DeckCardsList component for displaying cards in a deck
 */
export function DeckCardsList({
  cards,
  loading = false,
  onEditCard,
  onDeleteCard,
}: DeckCardsListProps) {
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <p className="text-gray-500">Loading cards...</p>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No cards in this deck yet.</p>
        <p className="text-sm text-gray-400">Add your first card to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2">
        {cards.map((card) => (
          <div
            key={card.id}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Card {card.order + 1}
                  </span>
                </div>
                <p className="font-medium text-gray-900 mt-2 break-words whitespace-pre-line">
                  {normalizeCardText(card.frontText)}
                </p>
                <p className="text-sm text-gray-600 mt-1 break-words whitespace-pre-line">
                  {normalizeCardText(card.backText)}
                </p>
              </div>

              {(onEditCard || onDeleteCard) && (
                <div className="flex gap-2 flex-shrink-0">
                  {onEditCard && (
                    <button
                      onClick={() => onEditCard(card)}
                      className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                    >
                      Edit
                    </button>
                  )}
                  {onDeleteCard && (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            'Are you sure you want to delete this card?'
                          )
                        ) {
                          onDeleteCard(card.id)
                        }
                      }}
                      className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="text-sm text-gray-500 pt-4">
        {cards.length} card{cards.length !== 1 ? 's' : ''} in deck
      </div>
    </div>
  )
}
