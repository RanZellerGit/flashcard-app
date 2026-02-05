/**
 * Storage abstraction layer using IndexedDB and localStorage
 */

import {
  Deck,
  Flashcard,
  SessionState,
  ValidationError,
  NotFoundError,
  StorageError,
} from './types'
import {
  generateId,
  formatDate,
  validateDeckName,
  validateCardText,
  sanitizeInput,
} from './utils'

const DB_NAME = 'flashcard-app'
const DB_VERSION = 1
const STORES = {
  DECKS: 'decks',
  CARDS: 'cards',
}
const SESSION_KEY = 'flashcard-app-session'

let db: IDBDatabase | null = null

/**
 * Initialize IndexedDB database
 */
export async function initializeStorage(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new StorageError('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      db = request.result
      resolve()
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Create decks store
      if (!database.objectStoreNames.contains(STORES.DECKS)) {
        const decksStore = database.createObjectStore(STORES.DECKS, {
          keyPath: 'id',
        })
        decksStore.createIndex('createdDate', 'createdDate', { unique: false })
      }

      // Create cards store
      if (!database.objectStoreNames.contains(STORES.CARDS)) {
        const cardsStore = database.createObjectStore(STORES.CARDS, {
          keyPath: 'id',
        })
        cardsStore.createIndex('deckId', 'deckId', { unique: false })
      }
    }
  })
}

/**
 * Get database connection
 */
function getDb(): IDBDatabase {
  if (!db) {
    throw new StorageError('Database not initialized. Call initializeStorage() first.')
  }
  return db
}

// ============================================================================
// DECK OPERATIONS
// ============================================================================

export async function createDeck(name: string): Promise<Deck> {
  if (!validateDeckName(name)) {
    throw new ValidationError('Deck name must be 1-200 characters')
  }

  const deck: Deck = {
    id: generateId(),
    name: sanitizeInput(name),
    createdDate: formatDate(),
    updatedDate: formatDate(),
    cardCount: 0,
  }

  return new Promise((resolve, reject) => {
    const transaction = getDb().transaction([STORES.DECKS], 'readwrite')
    const store = transaction.objectStore(STORES.DECKS)
    const request = store.add(deck)

    request.onsuccess = () => resolve(deck)
    request.onerror = () => reject(new StorageError('Failed to create deck'))
    transaction.onerror = () => reject(new StorageError('Transaction failed'))
  })
}

export async function getAllDecks(): Promise<Deck[]> {
  return new Promise((resolve, reject) => {
    const transaction = getDb().transaction([STORES.DECKS], 'readonly')
    const store = transaction.objectStore(STORES.DECKS)
    const index = store.index('createdDate')
    const request = index.getAll()

    request.onsuccess = () => {
      const decks = (request.result as Deck[]).reverse() // newest first
      resolve(decks)
    }
    request.onerror = () => reject(new StorageError('Failed to fetch decks'))
    transaction.onerror = () => reject(new StorageError('Transaction failed'))
  })
}

export async function getDeck(deckId: string): Promise<Deck | null> {
  return new Promise((resolve, reject) => {
    const transaction = getDb().transaction([STORES.DECKS], 'readonly')
    const store = transaction.objectStore(STORES.DECKS)
    const request = store.get(deckId)

    request.onsuccess = () => {
      resolve(request.result || null)
    }
    request.onerror = () => reject(new StorageError('Failed to fetch deck'))
    transaction.onerror = () => reject(new StorageError('Transaction failed'))
  })
}

export async function updateDeck(
  deckId: string,
  updates: Partial<Deck>
): Promise<Deck> {
  const deck = await getDeck(deckId)
  if (!deck) {
    throw new NotFoundError(`Deck with id ${deckId} not found`)
  }

  if (updates.name !== undefined && !validateDeckName(updates.name)) {
    throw new ValidationError('Deck name must be 1-200 characters')
  }

  const updated: Deck = {
    ...deck,
    ...updates,
    id: deck.id, // immutable
    createdDate: deck.createdDate, // immutable
    updatedDate: formatDate(),
  }

  return new Promise((resolve, reject) => {
    const transaction = getDb().transaction([STORES.DECKS], 'readwrite')
    const store = transaction.objectStore(STORES.DECKS)
    const request = store.put(updated)

    request.onsuccess = () => resolve(updated)
    request.onerror = () => reject(new StorageError('Failed to update deck'))
    transaction.onerror = () => reject(new StorageError('Transaction failed'))
  })
}

export async function deleteDeck(deckId: string): Promise<void> {
  const deck = await getDeck(deckId)
  if (!deck) {
    throw new NotFoundError(`Deck with id ${deckId} not found`)
  }

  // Delete all cards in this deck
  const cards = await getCardsByDeck(deckId)
  for (const card of cards) {
    await new Promise<void>((resolve, reject) => {
      const transaction = getDb().transaction([STORES.CARDS], 'readwrite')
      const store = transaction.objectStore(STORES.CARDS)
      const request = store.delete(card.id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new StorageError('Failed to delete card'))
      transaction.onerror = () => reject(new StorageError('Transaction failed'))
    })
  }

  // Delete deck
  return new Promise((resolve, reject) => {
    const transaction = getDb().transaction([STORES.DECKS], 'readwrite')
    const store = transaction.objectStore(STORES.DECKS)
    const request = store.delete(deckId)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(new StorageError('Failed to delete deck'))
    transaction.onerror = () => reject(new StorageError('Transaction failed'))
  })
}

// ============================================================================
// FLASHCARD OPERATIONS
// ============================================================================

export async function createCard(
  deckId: string,
  frontText: string,
  backText: string
): Promise<Flashcard> {
  // Validate deck exists
  const deck = await getDeck(deckId)
  if (!deck) {
    throw new NotFoundError(`Deck with id ${deckId} not found`)
  }

  // Validate card text
  if (!validateCardText(frontText)) {
    throw new ValidationError('Front text must be 1-500 characters')
  }
  if (!validateCardText(backText)) {
    throw new ValidationError('Back text must be 1-500 characters')
  }

  // Get current card count to set order
  const cards = await getCardsByDeck(deckId)
  const order = cards.length

  const card: Flashcard = {
    id: generateId(),
    deckId,
    frontText: sanitizeInput(frontText),
    backText: sanitizeInput(backText),
    order,
    createdDate: formatDate(),
  }

  return new Promise((resolve, reject) => {
    const transaction = getDb().transaction(
      [STORES.CARDS, STORES.DECKS],
      'readwrite'
    )

    // Add card
    const cardsStore = transaction.objectStore(STORES.CARDS)
    const addRequest = cardsStore.add(card)

    addRequest.onsuccess = async () => {
      // Update deck card count
      const decksStore = transaction.objectStore(STORES.DECKS)
      const updatedDeck = { ...deck, cardCount: deck.cardCount + 1, updatedDate: formatDate() }
      const updateRequest = decksStore.put(updatedDeck)

      updateRequest.onsuccess = () => resolve(card)
      updateRequest.onerror = () => reject(new StorageError('Failed to update deck'))
    }

    addRequest.onerror = () => reject(new StorageError('Failed to create card'))
    transaction.onerror = () => reject(new StorageError('Transaction failed'))
  })
}

export async function getCardsByDeck(deckId: string): Promise<Flashcard[]> {
  return new Promise((resolve, reject) => {
    const transaction = getDb().transaction([STORES.CARDS], 'readonly')
    const store = transaction.objectStore(STORES.CARDS)
    const index = store.index('deckId')
    const request = index.getAll(deckId)

    request.onsuccess = () => {
      const cards = (request.result as Flashcard[]).sort((a, b) => a.order - b.order)
      resolve(cards)
    }
    request.onerror = () => reject(new StorageError('Failed to fetch cards'))
    transaction.onerror = () => reject(new StorageError('Transaction failed'))
  })
}

export async function updateCard(
  cardId: string,
  updates: Partial<Flashcard>
): Promise<Flashcard> {
  return new Promise((resolve, reject) => {
    const transaction = getDb().transaction([STORES.CARDS], 'readonly')
    const store = transaction.objectStore(STORES.CARDS)
    const request = store.get(cardId)

    request.onsuccess = () => {
      const card = request.result as Flashcard | undefined
      if (!card) {
        reject(new NotFoundError(`Card with id ${cardId} not found`))
        return
      }

      if (updates.frontText !== undefined && !validateCardText(updates.frontText)) {
        reject(new ValidationError('Front text must be 1-500 characters'))
        return
      }
      if (updates.backText !== undefined && !validateCardText(updates.backText)) {
        reject(new ValidationError('Back text must be 1-500 characters'))
        return
      }

      const updated: Flashcard = {
        ...card,
        ...updates,
        id: card.id, // immutable
        deckId: card.deckId, // immutable
        order: card.order, // immutable
        createdDate: card.createdDate, // immutable
      }

      const writeTransaction = getDb().transaction([STORES.CARDS], 'readwrite')
      const writeStore = writeTransaction.objectStore(STORES.CARDS)
      const writeRequest = writeStore.put(updated)

      writeRequest.onsuccess = () => resolve(updated)
      writeRequest.onerror = () => reject(new StorageError('Failed to update card'))
      writeTransaction.onerror = () => reject(new StorageError('Transaction failed'))
    }

    request.onerror = () => reject(new StorageError('Failed to fetch card'))
    transaction.onerror = () => reject(new StorageError('Transaction failed'))
  })
}

export async function deleteCard(cardId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = getDb().transaction([STORES.CARDS, STORES.DECKS], 'readwrite')
    const cardsStore = transaction.objectStore(STORES.CARDS)
    const getRequest = cardsStore.get(cardId)

    getRequest.onsuccess = () => {
      const card = getRequest.result as Flashcard | undefined
      if (!card) {
        reject(new NotFoundError(`Card with id ${cardId} not found`))
        return
      }

      // Delete the card
      const deleteRequest = cardsStore.delete(cardId)

      deleteRequest.onsuccess = async () => {
        // Update deck card count
        const decksStore = transaction.objectStore(STORES.DECKS)
        const deckRequest = decksStore.get(card.deckId)

        deckRequest.onsuccess = () => {
          const deck = deckRequest.result as Deck
          const updated = {
            ...deck,
            cardCount: Math.max(0, deck.cardCount - 1),
            updatedDate: formatDate(),
          }
          const deckUpdateRequest = decksStore.put(updated)

          deckUpdateRequest.onsuccess = () => {
            // Renumber remaining cards
            // This is handled by the application layer for simplicity
            resolve()
          }
          deckUpdateRequest.onerror = () => reject(new StorageError('Failed to update deck'))
        }
        deckRequest.onerror = () => reject(new StorageError('Failed to fetch deck'))
      }

      deleteRequest.onerror = () => reject(new StorageError('Failed to delete card'))
    }

    getRequest.onerror = () => reject(new StorageError('Failed to fetch card'))
    transaction.onerror = () => reject(new StorageError('Transaction failed'))
  })
}

// ============================================================================
// SESSION STATE OPERATIONS
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
