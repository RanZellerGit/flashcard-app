'use client'

import { useEffect, useRef, useState } from 'react'
import { Deck } from '@/lib/types'
import { getAllDecks, deleteDeck } from '@/lib/storage'
import { DeckCard } from './DeckCard'
import { DashboardHeader } from './DashboardHeader'
import { SearchBar } from './SearchBar'
import { AutoPlayPlayer } from './AutoPlayPlayer'

interface Stats {
  totalCards: number
  masteredCards: number
  viewedToday: number
}

interface DashboardProps {
  onCreateDeck: () => void
  refreshTrigger?: number
  userId: string
  initialDecks?: Deck[]
  initialStats?: Stats
}

/**
 * T030: Dashboard component for displaying all decks
 */
export function Dashboard({
  onCreateDeck,
  refreshTrigger = 0,
  userId,
  initialDecks = [],
  initialStats,
}: DashboardProps) {
  const hasSSRData = initialStats !== undefined
  const [showPlayer, setShowPlayer] = useState(false)
  const [decks, setDecks] = useState<Deck[]>(initialDecks)
  const [loading, setLoading] = useState(!hasSSRData)
  const [totalCards, setTotalCards] = useState(initialStats?.totalCards ?? 0)
  const [masteredCards, setMasteredCards] = useState(initialStats?.masteredCards ?? 0)
  const [viewedToday, setViewedToday] = useState(initialStats?.viewedToday ?? 0)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip the initial fetch when SSR data was provided
    if (isFirstRender.current) {
      isFirstRender.current = false
      if (hasSSRData) return
    }

    const loadDecks = async () => {
      try {
        setLoading(true)
        const [deckList, statsRes] = await Promise.all([
          getAllDecks(userId),
          fetch('/api/stats', { cache: 'no-store' }),
        ])
        setDecks(deckList)
        if (statsRes.ok) {
          const stats = await statsRes.json()
          setTotalCards(stats.totalCards)
          setMasteredCards(stats.masteredCards)
          setViewedToday(stats.viewedToday ?? 0)
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
      <DashboardHeader onCreateDeck={onCreateDeck} onListenAll={() => setShowPlayer(true)} />

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
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Viewed today:</span>
              <span className="text-sm font-semibold text-blue-600">{viewedToday}</span>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="container mx-auto px-4 py-4">
        <SearchBar />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4">
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

      {showPlayer && <AutoPlayPlayer onClose={() => setShowPlayer(false)} />}
    </div>
  )
}
