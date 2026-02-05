'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Deck, Flashcard } from '@/lib/types'
import {
  getDeck,
  getCardsByDeck,
  createCard,
  updateCard,
  deleteCard,
} from '@/lib/storage'
import { useSession } from '@/lib/context/SessionContext'
import { DeckCardsList } from '@/components/DeckCardsList'
import { CardForm } from '@/components/CardForm'

/**
 * T023: DeckDetail page for managing cards in a deck
 */
export default function DeckDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { session } = useSession()
  const deckId = params.id as string

  const [deck, setDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)

  // Check if there's an active study session for this deck
  const hasActiveSession =
    session.currentStudySession?.deckId === deckId

  // Load deck and cards
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const deckData = await getDeck(deckId)
        if (!deckData) {
          router.push('/')
          return
        }
        setDeck(deckData)

        const cardsData = await getCardsByDeck(deckId)
        setCards(cardsData)
      } catch (error) {
        console.error('Failed to load deck:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [deckId, router])

  const handleAddCard = async (frontText: string, backText: string) => {
    try {
      const newCard = await createCard(deckId, frontText, backText)
      setCards([...cards, newCard])

      // Update deck card count
      if (deck) {
        setDeck({ ...deck, cardCount: deck.cardCount + 1 })
      }

      setShowAddForm(false)
    } catch (error) {
      console.error('Failed to add card:', error)
      throw error
    }
  }

  const handleUpdateCard = async (frontText: string, backText: string) => {
    if (!editingCard) return

    try {
      const updated = await updateCard(editingCard.id, {
        frontText,
        backText,
      })

      setCards(
        cards.map((c) => (c.id === updated.id ? updated : c))
      )
      setEditingCard(null)
    } catch (error) {
      console.error('Failed to update card:', error)
      throw error
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    try {
      await deleteCard(cardId)
      setCards(cards.filter((c) => c.id !== cardId))

      // Update deck card count
      if (deck) {
        setDeck({ ...deck, cardCount: Math.max(0, deck.cardCount - 1) })
      }
    } catch (error) {
      console.error('Failed to delete card:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <p>Loading deck...</p>
        </div>
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <p>Deck not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{deck.name}</h1>
          <p className="text-gray-600 mt-2">
            {deck.cardCount} card{deck.cardCount !== 1 ? 's' : ''} in deck
          </p>
        </div>

        {/* Cards List */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Cards
          </h2>
          <DeckCardsList
            cards={cards}
            loading={false}
            onEditCard={setEditingCard}
            onDeleteCard={handleDeleteCard}
          />
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingCard) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCard ? 'Edit Card' : 'Add New Card'}
            </h2>
            <CardForm
              deckId={deckId}
              initialCard={editingCard || undefined}
              onSubmit={editingCard ? handleUpdateCard : handleAddCard}
              onCancel={() => {
                setShowAddForm(false)
                setEditingCard(null)
              }}
            />
          </div>
        )}

        {/* Add Card Button */}
        {!showAddForm && !editingCard && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            + Add Card
          </button>
        )}

        {/* Study Buttons */}
        {cards.length > 0 && (
          <div className="mt-4 space-y-3">
            {hasActiveSession && (
              <button
                onClick={() => router.push(`/deck/${deckId}/study`)}
                className="w-full px-4 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition"
              >
                Resume Study (Card {(session.currentStudySession?.cardIndex ?? 0) + 1})
              </button>
            )}
            <button
              onClick={() =>
                router.push(
                  `/deck/${deckId}/study${hasActiveSession ? '?start=beginning' : ''}`
                )
              }
              className="w-full px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
            >
              {hasActiveSession ? 'Start From Beginning' : 'Start Study'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
