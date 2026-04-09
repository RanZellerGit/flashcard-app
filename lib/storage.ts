/**
 * Storage abstraction layer using REST API
 */

import {
  Deck,
  Flashcard,
  SessionState,
  ValidationError,
  NotFoundError,
  StorageError,
} from './types'

const SESSION_KEY = 'flashcard-app-session'

// ============================================================================
// DECK OPERATIONS
// ============================================================================

export async function createDeck(name: string, userId: string): Promise<Deck> {
  const response = await fetch('/api/decks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    const error = await response.json()
    if (response.status === 400) {
      throw new ValidationError(error.error || 'Invalid deck name')
    }
    throw new StorageError(error.error || 'Failed to create deck')
  }

  return response.json()
}

export async function getAllDecks(userId: string): Promise<Deck[]> {
  const response = await fetch('/api/decks', {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new StorageError('Failed to fetch decks')
  }

  return response.json()
}

export async function getDeck(deckId: string, userId: string): Promise<Deck | null> {
  const response = await fetch(`/api/decks/${deckId}`, {
    cache: 'no-store',
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new StorageError('Failed to fetch deck')
  }

  return response.json()
}

export async function updateDeck(
  deckId: string,
  updates: Partial<Deck>,
  userId: string
): Promise<Deck> {
  const response = await fetch(`/api/decks/${deckId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: updates.name }),
  })

  if (response.status === 404) {
    throw new NotFoundError(`Deck with id ${deckId} not found`)
  }

  if (!response.ok) {
    const error = await response.json()
    if (response.status === 400) {
      throw new ValidationError(error.error || 'Invalid deck name')
    }
    throw new StorageError(error.error || 'Failed to update deck')
  }

  return response.json()
}

export async function deleteDeck(deckId: string, userId: string): Promise<void> {
  const response = await fetch(`/api/decks/${deckId}`, {
    method: 'DELETE',
  })

  if (response.status === 404) {
    throw new NotFoundError(`Deck with id ${deckId} not found`)
  }

  if (!response.ok) {
    throw new StorageError('Failed to delete deck')
  }
}

// ============================================================================
// FLASHCARD OPERATIONS
// ============================================================================

export async function createCard(
  deckId: string,
  frontText: string,
  backText: string,
  userId: string
): Promise<Flashcard> {
  const response = await fetch('/api/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deckId, frontText, backText }),
  })

  if (response.status === 404) {
    throw new NotFoundError(`Deck with id ${deckId} not found`)
  }

  if (!response.ok) {
    const error = await response.json()
    if (response.status === 400) {
      throw new ValidationError(error.error || 'Invalid card text')
    }
    throw new StorageError(error.error || 'Failed to create card')
  }

  return response.json()
}

export async function getRandomCards(): Promise<Flashcard[]> {
  const response = await fetch('/api/cards/random', {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new StorageError('Failed to fetch random cards')
  }

  return response.json()
}

export async function markCardAsKnown(cardId: string, userId: string): Promise<Flashcard> {
  const response = await fetch(`/api/cards/${cardId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incrementKnown: true }),
  })

  if (response.status === 404) {
    throw new NotFoundError(`Card with id ${cardId} not found`)
  }

  if (!response.ok) {
    throw new StorageError('Failed to mark card as known')
  }

  return response.json()
}

export async function getCardsByDeck(deckId: string, userId: string): Promise<Flashcard[]> {
  const response = await fetch(`/api/cards-by-deck/${deckId}`, {
    cache: 'no-store',
  })

  if (response.status === 404) {
    return []
  }

  if (!response.ok) {
    throw new StorageError('Failed to fetch cards')
  }

  return response.json()
}

export async function updateCard(
  cardId: string,
  updates: Partial<Flashcard>,
  userId: string
): Promise<Flashcard> {
  const response = await fetch(`/api/cards/${cardId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      frontText: updates.frontText,
      backText: updates.backText,
    }),
  })

  if (response.status === 404) {
    throw new NotFoundError(`Card with id ${cardId} not found`)
  }

  if (!response.ok) {
    const error = await response.json()
    if (response.status === 400) {
      throw new ValidationError(error.error || 'Invalid card text')
    }
    throw new StorageError(error.error || 'Failed to update card')
  }

  return response.json()
}

export async function deleteCard(cardId: string, userId: string): Promise<void> {
  const response = await fetch(`/api/cards/${cardId}`, {
    method: 'DELETE',
  })

  if (response.status === 404) {
    throw new NotFoundError(`Card with id ${cardId} not found`)
  }

  if (!response.ok) {
    throw new StorageError('Failed to delete card')
  }
}

// ============================================================================
// SESSION STATE OPERATIONS (remains in localStorage - client-only)
// ============================================================================

export async function setSessionState(state: Partial<SessionState>): Promise<void> {
  try {
    const current = getSessionState()
    const updated = { ...current, ...state }
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new StorageError('localStorage quota exceeded')
    }
    throw new StorageError('Failed to save session state')
  }
}

export function getSessionState(): SessionState {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export async function clearSessionState(): Promise<void> {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    throw new StorageError('Failed to clear session state')
  }
}
