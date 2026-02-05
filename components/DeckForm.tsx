'use client'

import { useState } from 'react'
import { validateDeckName } from '@/lib/utils'
import { ValidationError } from '@/lib/types'

interface DeckFormProps {
  initialDeck?: { id: string; name: string }
  onSubmit: (name: string) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

/**
 * T021: DeckForm component for creating/editing decks
 */
export function DeckForm({
  initialDeck,
  onSubmit,
  onCancel,
  isLoading = false,
}: DeckFormProps) {
  const [name, setName] = useState(initialDeck?.name || '')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateDeckName(name)) {
      setError('Deck name must be 1-200 characters')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(name)
    } catch (err) {
      if (err instanceof ValidationError) {
        setError(err.message)
      } else {
        setError('Failed to save deck. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div>
        <label htmlFor="deck-name" className="block text-sm font-medium mb-2">
          Deck Name
        </label>
        <input
          id="deck-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Spanish Vocabulary"
          maxLength={200}
          disabled={isSubmitting || isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          autoFocus
        />
        <p className="text-xs text-gray-500 mt-1">
          {name.length}/200 characters
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting || isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : initialDeck ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}
