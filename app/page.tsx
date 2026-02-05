'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Dashboard } from '@/components/Dashboard'
import { DeckForm } from '@/components/DeckForm'
import { createDeck } from '@/lib/storage'

/**
 * T031: Dashboard page - home screen showing all decks
 */
export default function Home() {
  const { user } = useUser()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCreateDeck = async (name: string) => {
    if (!user?.id) {
      console.error('User not authenticated')
      return
    }

    try {
      await createDeck(name, user.id)
      setShowCreateForm(false)
      // Trigger refresh of deck list
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error('Failed to create deck:', error)
      throw error
    }
  }

  if (!user?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <>
      <Dashboard
        onCreateDeck={() => setShowCreateForm(true)}
        refreshTrigger={refreshTrigger}
        userId={user.id}
      />

      {/* Create Deck Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Create New Deck
            </h2>
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
