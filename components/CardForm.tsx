'use client'

import { useState } from 'react'
import { validateCardText } from '@/lib/utils'
import { ValidationError } from '@/lib/types'

interface CardFormProps {
  deckId: string
  initialCard?: {
    id: string
    frontText: string
    backText: string
  }
  onSubmit: (frontText: string, backText: string) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

/**
 * T022: CardForm component for creating/editing flashcards
 */
export function CardForm({
  deckId,
  initialCard,
  onSubmit,
  onCancel,
  isLoading = false,
}: CardFormProps) {
  const [frontText, setFrontText] = useState(initialCard?.frontText || '')
  const [backText, setBackText] = useState(initialCard?.backText || '')
  const [frontError, setFrontError] = useState('')
  const [backError, setBackError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFrontError('')
    setBackError('')

    if (!validateCardText(frontText)) {
      setFrontError('Front text must be 1-500 characters')
      return
    }

    if (!validateCardText(backText)) {
      setBackError('Back text must be 1-500 characters')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(frontText, backText)
    } catch (err) {
      if (err instanceof ValidationError) {
        if (err.message.includes('Front')) {
          setFrontError(err.message)
        } else if (err.message.includes('Back')) {
          setBackError(err.message)
        } else {
          setFrontError(err.message)
        }
      } else {
        setFrontError('Failed to save card. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
      <div>
        <label htmlFor="front-text" className="block text-sm font-medium mb-2">
          Front (Question)
        </label>
        <textarea
          id="front-text"
          value={frontText}
          onChange={(e) => setFrontText(e.target.value)}
          placeholder="e.g., What is the Spanish word for hello?"
          maxLength={500}
          disabled={isSubmitting || isLoading}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
        <div className="flex justify-between items-start mt-1">
          <p className="text-xs text-gray-500">
            {frontText.length}/500 characters
          </p>
          {frontError && <p className="text-xs text-red-600">{frontError}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="back-text" className="block text-sm font-medium mb-2">
          Back (Answer)
        </label>
        <textarea
          id="back-text"
          value={backText}
          onChange={(e) => setBackText(e.target.value)}
          placeholder="e.g., Hola"
          maxLength={500}
          disabled={isSubmitting || isLoading}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
        <div className="flex justify-between items-start mt-1">
          <p className="text-xs text-gray-500">
            {backText.length}/500 characters
          </p>
          {backError && <p className="text-xs text-red-600">{backError}</p>}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4">
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
          {isSubmitting ? 'Saving...' : initialCard ? 'Update' : 'Add Card'}
        </button>
      </div>
    </form>
  )
}
