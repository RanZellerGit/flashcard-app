'use client'

import { useState } from 'react'
import { Dashboard } from '@/components/Dashboard'
import { DeckForm } from '@/components/DeckForm'
import { createDeck } from '@/lib/storage'
import { Deck } from '@/lib/types'

interface HomeClientProps {
  userId: string
  initialDecks: Deck[]
  initialStats: { totalCards: number; masteredCards: number; viewedToday: number }
}

export function HomeClient({ userId, initialDecks, initialStats }: HomeClientProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCreateDeck = async (name: string) => {
    try {
      await createDeck(name, userId)
      setShowCreateForm(false)
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error('Failed to create deck:', error)
      throw error
    }
  }

  return (
    <>
      <Dashboard
        onCreateDeck={() => setShowCreateForm(true)}
        refreshTrigger={refreshTrigger}
        userId={userId}
        initialDecks={initialDecks}
        initialStats={initialStats}
      />

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Deck</h2>
            <DeckForm
              onSubmit={handleCreateDeck}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
