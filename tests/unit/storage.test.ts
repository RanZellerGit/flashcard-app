/**
 * Unit tests for storage abstraction layer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  initializeStorage,
  createDeck,
  getAllDecks,
  getDeck,
  updateDeck,
  deleteDeck,
  createCard,
  getCardsByDeck,
  updateCard,
  deleteCard,
  setSessionState,
  getSessionState,
  clearSessionState,
} from '@/lib/storage'
import {
  ValidationError,
  NotFoundError,
  type Deck,
  type Flashcard,
} from '@/lib/types'

describe('Storage Layer', () => {
  beforeEach(async () => {
    // Initialize storage before each test
    // Clear IndexedDB
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('flashcard-app')
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
    })

    // Re-initialize
    await initializeStorage()

    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Deck Operations', () => {
    it('should create a deck with valid name', async () => {
      const deck = await createDeck('Spanish Vocabulary')
      expect(deck.name).toBe('Spanish Vocabulary')
      expect(deck.id).toBeDefined()
      expect(deck.cardCount).toBe(0)
      expect(deck.createdDate).toBeDefined()
      expect(deck.updatedDate).toBeDefined()
    })

    it('should reject deck creation with empty name', async () => {
      await expect(createDeck('')).rejects.toThrow(ValidationError)
    })

    it('should reject deck creation with name > 200 chars', async () => {
      const longName = 'a'.repeat(201)
      await expect(createDeck(longName)).rejects.toThrow(ValidationError)
    })

    it('should trim whitespace from deck name', async () => {
      const deck = await createDeck('  Spanish Vocabulary  ')
      expect(deck.name).toBe('Spanish Vocabulary')
    })

    it('should fetch all decks', async () => {
      await createDeck('Deck 1')
      await createDeck('Deck 2')
      await createDeck('Deck 3')

      const decks = await getAllDecks()
      expect(decks).toHaveLength(3)
      expect(decks[0].name).toMatch(/^Deck/)
    })

    it('should fetch all decks in descending order by creation date', async () => {
      const deck1 = await createDeck('Deck 1')
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10))
      const deck2 = await createDeck('Deck 2')

      const decks = await getAllDecks()
      expect(decks[0].id).toBe(deck2.id)
      expect(decks[1].id).toBe(deck1.id)
    })

    it('should fetch single deck by id', async () => {
      const created = await createDeck('Test Deck')
      const fetched = await getDeck(created.id)

      expect(fetched).not.toBeNull()
      expect(fetched!.id).toBe(created.id)
      expect(fetched!.name).toBe('Test Deck')
    })

    it('should return null for non-existent deck', async () => {
      const fetched = await getDeck('non-existent-id')
      expect(fetched).toBeNull()
    })

    it('should update deck name', async () => {
      const created = await createDeck('Old Name')
      const updated = await updateDeck(created.id, { name: 'New Name' })

      expect(updated.name).toBe('New Name')
      expect(updated.id).toBe(created.id)
      expect(updated.updatedDate > created.updatedDate).toBe(true)
    })

    it('should reject update with invalid name', async () => {
      const deck = await createDeck('Test')
      await expect(updateDeck(deck.id, { name: '' })).rejects.toThrow(
        ValidationError
      )
    })

    it('should reject update of non-existent deck', async () => {
      await expect(
        updateDeck('non-existent', { name: 'New Name' })
      ).rejects.toThrow(NotFoundError)
    })

    it('should delete deck', async () => {
      const deck = await createDeck('To Delete')
      await deleteDeck(deck.id)

      const fetched = await getDeck(deck.id)
      expect(fetched).toBeNull()
    })

    it('should cascade delete cards when deck is deleted', async () => {
      const deck = await createDeck('Test Deck')
      const card1 = await createCard(deck.id, 'Q1', 'A1')
      const card2 = await createCard(deck.id, 'Q2', 'A2')

      await deleteDeck(deck.id)

      const cards = await getCardsByDeck(deck.id)
      expect(cards).toHaveLength(0)
    })
  })

  describe('Flashcard Operations', () => {
    let testDeck: Deck

    beforeEach(async () => {
      testDeck = await createDeck('Test Deck')
    })

    it('should create a card in a deck', async () => {
      const card = await createCard(
        testDeck.id,
        'What is 2+2?',
        '4'
      )

      expect(card.frontText).toBe('What is 2+2?')
      expect(card.backText).toBe('4')
      expect(card.deckId).toBe(testDeck.id)
      expect(card.order).toBe(0)
    })

    it('should reject card creation with empty front text', async () => {
      await expect(createCard(testDeck.id, '', 'answer')).rejects.toThrow(
        ValidationError
      )
    })

    it('should reject card creation with empty back text', async () => {
      await expect(
        createCard(testDeck.id, 'question', '')
      ).rejects.toThrow(ValidationError)
    })

    it('should reject card creation with text > 500 chars', async () => {
      const longText = 'a'.repeat(501)
      await expect(
        createCard(testDeck.id, longText, 'answer')
      ).rejects.toThrow(ValidationError)
    })

    it('should reject card creation for non-existent deck', async () => {
      await expect(
        createCard('non-existent', 'question', 'answer')
      ).rejects.toThrow(NotFoundError)
    })

    it('should fetch all cards in a deck', async () => {
      await createCard(testDeck.id, 'Q1', 'A1')
      await createCard(testDeck.id, 'Q2', 'A2')
      await createCard(testDeck.id, 'Q3', 'A3')

      const cards = await getCardsByDeck(testDeck.id)
      expect(cards).toHaveLength(3)
    })

    it('should fetch cards ordered by order field', async () => {
      const card1 = await createCard(testDeck.id, 'Q1', 'A1')
      const card2 = await createCard(testDeck.id, 'Q2', 'A2')
      const card3 = await createCard(testDeck.id, 'Q3', 'A3')

      const cards = await getCardsByDeck(testDeck.id)
      expect(cards[0].id).toBe(card1.id)
      expect(cards[1].id).toBe(card2.id)
      expect(cards[2].id).toBe(card3.id)
    })

    it('should update card text', async () => {
      const card = await createCard(testDeck.id, 'Q1', 'A1')
      const updated = await updateCard(card.id, {
        frontText: 'Updated Q1',
        backText: 'Updated A1',
      })

      expect(updated.frontText).toBe('Updated Q1')
      expect(updated.backText).toBe('Updated A1')
      expect(updated.id).toBe(card.id)
    })

    it('should reject update with invalid text', async () => {
      const card = await createCard(testDeck.id, 'Q1', 'A1')
      await expect(
        updateCard(card.id, { frontText: '' })
      ).rejects.toThrow(ValidationError)
    })

    it('should delete a card', async () => {
      const card = await createCard(testDeck.id, 'Q1', 'A1')
      await deleteCard(card.id)

      const cards = await getCardsByDeck(testDeck.id)
      expect(cards).toHaveLength(0)
    })

    it('should update deck card count when card is created', async () => {
      await createCard(testDeck.id, 'Q1', 'A1')
      await createCard(testDeck.id, 'Q2', 'A2')

      const updated = await getDeck(testDeck.id)
      expect(updated!.cardCount).toBe(2)
    })

    it('should update deck card count when card is deleted', async () => {
      const card1 = await createCard(testDeck.id, 'Q1', 'A1')
      const card2 = await createCard(testDeck.id, 'Q2', 'A2')

      await deleteCard(card1.id)

      const updated = await getDeck(testDeck.id)
      expect(updated!.cardCount).toBe(1)
    })
  })

  describe('Session State Operations', () => {
    it('should save and retrieve session state', async () => {
      await setSessionState({ currentDeckId: 'deck-123' })

      const state = getSessionState()
      expect(state.currentDeckId).toBe('deck-123')
    })

    it('should merge session state updates', async () => {
      await setSessionState({ currentDeckId: 'deck-123' })
      await setSessionState({
        currentStudySession: {
          deckId: 'deck-123',
          cardIndex: 3,
          isFlipped: false,
        },
      })

      const state = getSessionState()
      expect(state.currentDeckId).toBe('deck-123')
      expect(state.currentStudySession?.cardIndex).toBe(3)
    })

    it('should clear session state', async () => {
      await setSessionState({ currentDeckId: 'deck-123' })
      await clearSessionState()

      const state = getSessionState()
      expect(Object.keys(state)).toHaveLength(0)
    })

    it('should return empty object for non-existent session', () => {
      localStorage.clear()
      const state = getSessionState()
      expect(state).toEqual({})
    })
  })

  describe('Data Integrity', () => {
    it('should prevent orphaned cards', async () => {
      const deck = await createDeck('Test')
      await createCard(deck.id, 'Q', 'A')

      // Try to get cards from deleted deck - should return empty
      await deleteDeck(deck.id)
      const cards = await getCardsByDeck(deck.id)
      expect(cards).toHaveLength(0)
    })

    it('should maintain referential integrity', async () => {
      const deck = await createDeck('Test')
      const card = await createCard(deck.id, 'Q', 'A')

      // Card's deckId should match parent deck
      expect(card.deckId).toBe(deck.id)

      const fetched = await getDeck(card.deckId)
      expect(fetched!.id).toBe(deck.id)
    })
  })
})
