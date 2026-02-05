/**
 * Storage abstraction layer using IndexedDB with localStorage fallback
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
const DB_VERSION = 2
const STORES = {
  DECKS: 'decks',
  CARDS: 'cards',
}
const SESSION_KEY = 'flashcard-app-session'
const FALLBACK_DECKS_KEY = 'flashcard-app-decks'
const FALLBACK_CARDS_KEY = 'flashcard-app-cards'

let db: IDBDatabase | null = null
let useIndexedDB = false

/**
 * Check if IndexedDB is available
 */
function isIndexedDBAvailable(): boolean {
  try {
    const test = '__indexeddb_available__'
    const storage = typeof window !== 'undefined' ? window.indexedDB : null
    if (!storage) return false
    const request = storage.open(test)
    request.onsuccess = () => {
      storage.deleteDatabase(test)
    }
    return true
  } catch {
    return false
  }
}

/**
 * Initialize storage
 */
export async function initializeStorage(): Promise<void> {
  if (!isIndexedDBAvailable()) {
    console.warn('IndexedDB not available. Using localStorage fallback.')
    useIndexedDB = false
    return
  }

  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.warn('Failed to open IndexedDB. Using localStorage fallback.')
      useIndexedDB = false
      resolve()
    }

    request.onsuccess = () => {
      db = request.result
      useIndexedDB = true
      resolve()
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      if (!database.objectStoreNames.contains(STORES.DECKS)) {
        const decksStore = database.createObjectStore(STORES.DECKS, {
          keyPath: 'id',
        })
        decksStore.createIndex('createdDate', 'createdDate', { unique: false })
        decksStore.createIndex('userId', 'userId', { unique: false })
      }

      if (!database.objectStoreNames.contains(STORES.CARDS)) {
        const cardsStore = database.createObjectStore(STORES.CARDS, {
          keyPath: 'id',
        })
        cardsStore.createIndex('deckId', 'deckId', { unique: false })
        cardsStore.createIndex('userId', 'userId', { unique: false })
      }
    }
  })
}

/**
 * Get all decks from storage
 */
function getAllDecksFromStorage(): Deck[] {
  try {
    const stored = localStorage.getItem(FALLBACK_DECKS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Save all decks to storage
 */
function saveAllDecksToStorage(decks: Deck[]): void {
  try {
    localStorage.setItem(FALLBACK_DECKS_KEY, JSON.stringify(decks))
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new StorageError('localStorage quota exceeded')
    }
    throw new StorageError('Failed to save decks')
  }
}

/**
 * Get all cards from storage
 */
function getAllCardsFromStorage(): Flashcard[] {
  try {
    const stored = localStorage.getItem(FALLBACK_CARDS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Save all cards to storage
 */
function saveAllCardsToStorage(cards: Flashcard[]): void {
  try {
    localStorage.setItem(FALLBACK_CARDS_KEY, JSON.stringify(cards))
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new StorageError('localStorage quota exceeded')
    }
    throw new StorageError('Failed to save cards')
  }
}

// ============================================================================
// DECK OPERATIONS
// ============================================================================

export async function createDeck(name: string, userId: string): Promise<Deck> {
  if (!validateDeckName(name)) {
    throw new ValidationError('Deck name must be 1-200 characters')
  }

  const deck: Deck = {
    id: generateId(),
    name: sanitizeInput(name),
    createdDate: formatDate(),
    updatedDate: formatDate(),
    cardCount: 0,
    userId,
  }

  if (useIndexedDB && db) {
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORES.DECKS], 'readwrite')
      const store = transaction.objectStore(STORES.DECKS)
      const request = store.add(deck)

      request.onsuccess = () => resolve(deck)
      request.onerror = () => reject(new StorageError('Failed to create deck'))
      transaction.onerror = () => reject(new StorageError('Transaction failed'))
    })
  } else {
    const decks = getAllDecksFromStorage()
    decks.push(deck)
    saveAllDecksToStorage(decks)
    return deck
  }
}

export async function getAllDecks(userId: string): Promise<Deck[]> {
  if (useIndexedDB && db) {
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORES.DECKS], 'readonly')
      const store = transaction.objectStore(STORES.DECKS)
      const index = store.index('userId')
      const request = index.getAll(userId)

      request.onsuccess = () => {
        const decks = (request.result as Deck[]).sort((a, b) =>
          new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
        )
        resolve(decks)
      }
      request.onerror = () => reject(new StorageError('Failed to fetch decks'))
      transaction.onerror = () => reject(new StorageError('Transaction failed'))
    })
  } else {
    const decks = getAllDecksFromStorage().filter((d) => d.userId === userId)
    return decks.sort((a, b) =>
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    )
  }
}

export async function getDeck(deckId: string, userId: string): Promise<Deck | null> {
  if (useIndexedDB && db) {
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORES.DECKS], 'readonly')
      const store = transaction.objectStore(STORES.DECKS)
      const request = store.get(deckId)

      request.onsuccess = () => {
        const deck = request.result || null
        if (deck && deck.userId !== userId) {
          resolve(null)
        } else {
          resolve(deck)
        }
      }
      request.onerror = () => reject(new StorageError('Failed to fetch deck'))
      transaction.onerror = () => reject(new StorageError('Transaction failed'))
    })
  } else {
    const decks = getAllDecksFromStorage()
    const deck = decks.find((d) => d.id === deckId) || null
    return deck && deck.userId === userId ? deck : null
  }
}

export async function updateDeck(
  deckId: string,
  updates: Partial<Deck>,
  userId: string
): Promise<Deck> {
  const deck = await getDeck(deckId, userId)
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

  if (useIndexedDB && db) {
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORES.DECKS], 'readwrite')
      const store = transaction.objectStore(STORES.DECKS)
      const request = store.put(updated)

      request.onsuccess = () => resolve(updated)
      request.onerror = () => reject(new StorageError('Failed to update deck'))
      transaction.onerror = () => reject(new StorageError('Transaction failed'))
    })
  } else {
    const decks = getAllDecksFromStorage()
    const index = decks.findIndex((d) => d.id === deckId)
    if (index !== -1) {
      decks[index] = updated
      saveAllDecksToStorage(decks)
    }
    return updated
  }
}

export async function deleteDeck(deckId: string, userId: string): Promise<void> {
  const deck = await getDeck(deckId, userId)
  if (!deck) {
    throw new NotFoundError(`Deck with id ${deckId} not found`)
  }

  // Delete all cards in this deck
  const cards = await getCardsByDeck(deckId, userId)
  for (const card of cards) {
    if (useIndexedDB && db) {
      await new Promise<void>((resolve, reject) => {
        const transaction = db!.transaction([STORES.CARDS], 'readwrite')
        const store = transaction.objectStore(STORES.CARDS)
        const request = store.delete(card.id)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(new StorageError('Failed to delete card'))
        transaction.onerror = () => reject(new StorageError('Transaction failed'))
      })
    } else {
      const allCards = getAllCardsFromStorage()
      const filtered = allCards.filter((c) => c.id !== card.id)
      saveAllCardsToStorage(filtered)
    }
  }

  // Delete deck
  if (useIndexedDB && db) {
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORES.DECKS], 'readwrite')
      const store = transaction.objectStore(STORES.DECKS)
      const request = store.delete(deckId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new StorageError('Failed to delete deck'))
      transaction.onerror = () => reject(new StorageError('Transaction failed'))
    })
  } else {
    const decks = getAllDecksFromStorage()
    const filtered = decks.filter((d) => d.id !== deckId)
    saveAllDecksToStorage(filtered)
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
  // Validate deck exists
  const deck = await getDeck(deckId, userId)
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
  const cards = await getCardsByDeck(deckId, userId)
  const order = cards.length

  const card: Flashcard = {
    id: generateId(),
    deckId,
    frontText: sanitizeInput(frontText),
    backText: sanitizeInput(backText),
    order,
    createdDate: formatDate(),
    userId,
  }

  if (useIndexedDB && db) {
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORES.CARDS, STORES.DECKS], 'readwrite')

      // Add card
      const cardsStore = transaction.objectStore(STORES.CARDS)
      const addRequest = cardsStore.add(card)

      addRequest.onsuccess = () => {
        // Update deck card count
        const decksStore = transaction.objectStore(STORES.DECKS)
        const updatedDeck = {
          ...deck,
          cardCount: deck.cardCount + 1,
          updatedDate: formatDate(),
        }
        const updateRequest = decksStore.put(updatedDeck)

        updateRequest.onsuccess = () => resolve(card)
        updateRequest.onerror = () => reject(new StorageError('Failed to update deck'))
      }

      addRequest.onerror = () => reject(new StorageError('Failed to create card'))
      transaction.onerror = () => reject(new StorageError('Transaction failed'))
    })
  } else {
    const allCards = getAllCardsFromStorage()
    allCards.push(card)
    saveAllCardsToStorage(allCards)

    const updatedDeck = {
      ...deck,
      cardCount: deck.cardCount + 1,
      updatedDate: formatDate(),
    }
    await updateDeck(deckId, updatedDeck, userId)

    return card
  }
}

export async function getCardsByDeck(deckId: string, userId: string): Promise<Flashcard[]> {
  if (useIndexedDB && db) {
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORES.CARDS], 'readonly')
      const store = transaction.objectStore(STORES.CARDS)
      const index = store.index('deckId')
      const request = index.getAll(deckId)

      request.onsuccess = () => {
        const cards = (request.result as Flashcard[])
          .filter((c) => c.userId === userId)
          .sort((a, b) => a.order - b.order)
        resolve(cards)
      }
      request.onerror = () => reject(new StorageError('Failed to fetch cards'))
      transaction.onerror = () => reject(new StorageError('Transaction failed'))
    })
  } else {
    const allCards = getAllCardsFromStorage()
    return allCards
      .filter((c) => c.deckId === deckId && c.userId === userId)
      .sort((a, b) => a.order - b.order)
  }
}

export async function updateCard(
  cardId: string,
  updates: Partial<Flashcard>,
  userId: string
): Promise<Flashcard> {
  if (useIndexedDB && db) {
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORES.CARDS], 'readonly')
      const store = transaction.objectStore(STORES.CARDS)
      const request = store.get(cardId)

      request.onsuccess = () => {
        const card = request.result as Flashcard | undefined
        if (!card || card.userId !== userId) {
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
          id: card.id,
          deckId: card.deckId,
          order: card.order,
          createdDate: card.createdDate,
        }

        const writeTransaction = db!.transaction([STORES.CARDS], 'readwrite')
        const writeStore = writeTransaction.objectStore(STORES.CARDS)
        const writeRequest = writeStore.put(updated)

        writeRequest.onsuccess = () => resolve(updated)
        writeRequest.onerror = () => reject(new StorageError('Failed to update card'))
        writeTransaction.onerror = () => reject(new StorageError('Transaction failed'))
      }

      request.onerror = () => reject(new StorageError('Failed to fetch card'))
      transaction.onerror = () => reject(new StorageError('Transaction failed'))
    })
  } else {
    const allCards = getAllCardsFromStorage()
    const card = allCards.find((c) => c.id === cardId)
    if (!card || card.userId !== userId) {
      throw new NotFoundError(`Card with id ${cardId} not found`)
    }

    if (updates.frontText !== undefined && !validateCardText(updates.frontText)) {
      throw new ValidationError('Front text must be 1-500 characters')
    }
    if (updates.backText !== undefined && !validateCardText(updates.backText)) {
      throw new ValidationError('Back text must be 1-500 characters')
    }

    const updated: Flashcard = {
      ...card,
      ...updates,
      id: card.id,
      deckId: card.deckId,
      order: card.order,
      createdDate: card.createdDate,
      userId: card.userId,
    }

    const index = allCards.findIndex((c) => c.id === cardId)
    allCards[index] = updated
    saveAllCardsToStorage(allCards)

    return updated
  }
}

export async function deleteCard(cardId: string, userId: string): Promise<void> {
  if (useIndexedDB && db) {
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORES.CARDS, STORES.DECKS], 'readwrite')
      const cardsStore = transaction.objectStore(STORES.CARDS)
      const getRequest = cardsStore.get(cardId)

      getRequest.onsuccess = () => {
        const card = getRequest.result as Flashcard | undefined
        if (!card || card.userId !== userId) {
          reject(new NotFoundError(`Card with id ${cardId} not found`))
          return
        }

        const deleteRequest = cardsStore.delete(cardId)

        deleteRequest.onsuccess = () => {
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

            deckUpdateRequest.onsuccess = () => resolve()
            deckUpdateRequest.onerror = () =>
              reject(new StorageError('Failed to update deck'))
          }
          deckRequest.onerror = () => reject(new StorageError('Failed to fetch deck'))
        }

        deleteRequest.onerror = () => reject(new StorageError('Failed to delete card'))
      }

      getRequest.onerror = () => reject(new StorageError('Failed to fetch card'))
      transaction.onerror = () => reject(new StorageError('Transaction failed'))
    })
  } else {
    const allCards = getAllCardsFromStorage()
    const card = allCards.find((c) => c.id === cardId)
    if (!card || card.userId !== userId) {
      throw new NotFoundError(`Card with id ${cardId} not found`)
    }

    const filtered = allCards.filter((c) => c.id !== cardId)
    saveAllCardsToStorage(filtered)

    const deck = await getDeck(card.deckId, userId)
    if (deck) {
      await updateDeck(card.deckId, {
        cardCount: Math.max(0, deck.cardCount - 1),
      }, userId)
    }
  }
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
