'use client'

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

/**
 * T032: DashboardHeader component for top navigation
 */
export function DashboardHeader({
  onCreateDeck,
  onListenAll,
  onPracticeListen,
}: {
  onCreateDeck: () => void
  onListenAll: () => void
  onPracticeListen: () => void
}) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 sm:py-5">
        {/* Top row: title + user avatar */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Flashcard App</h1>
          <UserButton />
        </div>

        {/* Bottom row: action buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <button
            onClick={onListenAll}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-700 transition"
          >
            ▶ Listen All
          </button>
          <button
            onClick={onPracticeListen}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-teal-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-teal-700 transition"
          >
            <span className="sm:hidden">▶ Listen 10</span>
            <span className="hidden sm:inline">▶ Practice Listen (10)</span>
          </button>
          <Link
            href="/swipe"
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-purple-700 transition"
          >
            Practice
          </Link>
          <Link
            href="/mastered"
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-yellow-600 transition"
          >
            <span className="sm:hidden">Mastered</span>
            <span className="hidden sm:inline">Review Mastered</span>
          </Link>
          <button
            onClick={onCreateDeck}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            <span className="sm:hidden">+ Deck</span>
            <span className="hidden sm:inline">+ Create New Deck</span>
          </button>
        </div>
      </div>
    </div>
  )
}
