'use client'

/**
 * T032: DashboardHeader component for top navigation
 */
export function DashboardHeader({
  onCreateDeck,
}: {
  onCreateDeck: () => void
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

        <button
          onClick={onCreateDeck}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          + Create New Deck
        </button>
      </div>
    </div>
  )
}
