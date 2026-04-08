/**
 * Type definitions for Flashcard Application
 */

export interface Deck {
  id: string
  name: string
  createdDate: string // ISO 8601
  updatedDate: string // ISO 8601
  cardCount: number
  userId: string // Clerk user ID
}

export interface Flashcard {
  id: string
  deckId: string
  frontText: string
  backText: string
  order: number
  isKnown: boolean
  createdDate: string // ISO 8601
  userId: string // Clerk user ID
}

export interface SessionState {
  currentDeckId?: string
  currentStudySession?: {
    deckId: string
    cardIndex: number
    isFlipped: boolean
  }
}

// Error types
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QuotaExceededError'
  }
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageError'
  }
}
