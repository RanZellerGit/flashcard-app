'use client'

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

/**
 * T032: DashboardHeader component for top navigation
 */
export function DashboardHeader({
  onCreateDeck,
  onListenAll,
}: {
  onCreateDeck: () => void
  onListenAll: () => void
}) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Flashcard App</h1>
          <p className="text-sm text-gray-600 mt-1">
            Learn at your own pace
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onListenAll}
            className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
          >
            ▶ Listen All
          </button>
          <Link
            href="/swipe"
            className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition"
          >
            Practice
          </Link>
          <Link
            href="/mastered"
            className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition"
          >
            Review Mastered
          </Link>
          <button
            onClick={onCreateDeck}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            + Create New Deck
          </button>
          <UserButton />
        </div>
      </div>
    </div>
  )
}
