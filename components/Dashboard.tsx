'use client'

import { useEffect, useState } from 'react'
import { Deck } from '@/lib/types'
import { getAllDecks, deleteDeck } from '@/lib/storage'
import { DeckCard } from './DeckCard'
import { DashboardHeader } from './DashboardHeader'
import { AdBanner } from './AdBanner'

interface DashboardProps {
  onCreateDeck: () => void
  refreshTrigger?: number
  userId: string
}

/**
 * T030: Dashboard component for displaying all decks
 */
export function Dashboard({ onCreateDeck, refreshTrigger = 0, userId }: DashboardProps) {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCards, setTotalCards] = useState(0)
  const [masteredCards, setMasteredCards] = useState(0)

  // Load decks on mount and when refresh is triggered
  useEffect(() => {
    const loadDecks = async () => {
      try {
        setLoading(true)
        const [deckList, statsRes] = await Promise.all([
          getAllDecks(userId),
          fetch('/api/stats'),
        ])
        setDecks(deckList)
        if (statsRes.ok) {
          const stats = await statsRes.json()
          setTotalCards(stats.totalCards)
          setMasteredCards(stats.masteredCards)
        }
      } catch (error) {
        console.error('Failed to load decks:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDecks()
  }, [refreshTrigger, userId])

  const handleDeleteDeck = async (deckId: string) => {
    try {
      await deleteDeck(deckId, userId)
      setDecks(decks.filter((d) => d.id !== deckId))
    } catch (error) {
      console.error('Failed to delete deck:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader onCreateDeck={onCreateDeck} />

      {/* Stats Bar */}
      {!loading && (
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-3 flex gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Total words:</span>
              <span className="text-sm font-semibold text-gray-900">{totalCards}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Mastered:</span>
              <span className="text-sm font-semibold text-green-600">{masteredCards}</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Ad Banner */}
      <div className="container mx-auto px-4 pt-4">
        <AdBanner adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER || ''} className="mb-2" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500">Loading your decks...</p>
          </div>
        ) : decks.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-6">
              <div className="inline-block p-4 bg-blue-50 rounded-full mb-4">
                <span className="text-4xl">📚</span>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No decks yet
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first flashcard deck to get started learning
            </p>
            <button
              onClick={onCreateDeck}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Create Your First Deck
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Decks</h2>
              <p className="text-gray-600 mt-1">
                {decks.length} deck{decks.length !== 1 ? 's' : ''} total
              </p>
            </div>

            {/* Decks Grid - Responsive across all breakpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {decks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  onDelete={handleDeleteDeck}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Ad Banner */}
      <div className="container mx-auto px-4 pb-4">
        <AdBanner adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER || ''} className="mt-8" />
      </div>
    </div>
  )
}
