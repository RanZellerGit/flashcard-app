/**
 * Integration tests for User Story 1: Create Text-Based Flashcard Deck
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  initializeStorage,
  createDeck,
  createCard,
  getCardsByDeck,
  getAllDecks,
  getDeck,
} from '@/lib/storage'

describe('User Story 1: Create Text-Based Flashcard Deck', () => {
  beforeEach(async () => {
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

  it('should allow user to create deck and add cards', async () => {
    // User creates a new deck
    const deck = await createDeck('Spanish Vocabulary')
    expect(deck.name).toBe('Spanish Vocabulary')
    expect(deck.cardCount).toBe(0)

    // User adds first card
    const card1 = await createCard(
      deck.id,
      'What is the Spanish word for hello?',
      'Hola'
    )
    expect(card1.frontText).toBe('What is the Spanish word for hello?')
    expect(card1.backText).toBe('Hola')
    expect(card1.order).toBe(0)

    // User adds more cards
    const card2 = await createCard(
      deck.id,
      'What is the Spanish word for goodbye?',
      'Adiós'
    )
    expect(card2.order).toBe(1)

    const card3 = await createCard(
      deck.id,
      'What is the Spanish word for thank you?',
      'Gracias'
    )
    expect(card3.order).toBe(2)

    const card4 = await createCard(
      deck.id,
      'What is the Spanish word for please?',
      'Por favor'
    )
    const card5 = await createCard(
      deck.id,
      'What is the Spanish word for yes?',
      'Sí'
    )

    // Verify all cards are saved and visible
    const cards = await getCardsByDeck(deck.id)
    expect(cards).toHaveLength(5)
    expect(cards[0].id).toBe(card1.id)
    expect(cards[4].id).toBe(card5.id)

    // Verify deck card count updated
    const updatedDeck = await getDeck(deck.id)
    expect(updatedDeck!.cardCount).toBe(5)
  })

  it('should prevent saving card with empty front text', async () => {
    const deck = await createDeck('Test Deck')

    try {
      await createCard(deck.id, '', 'Answer')
      expect.fail('Should have thrown ValidationError')
    } catch (error: any) {
      expect(error.name).toBe('ValidationError')
      expect(error.message).toContain('Front text')
    }
  })

  it('should prevent saving card with empty back text', async () => {
    const deck = await createDeck('Test Deck')

    try {
      await createCard(deck.id, 'Question', '')
      expect.fail('Should have thrown ValidationError')
    } catch (error: any) {
      expect(error.name).toBe('ValidationError')
      expect(error.message).toContain('Back text')
    }
  })

  it('should allow viewing all decks with card counts', async () => {
    // Create first deck with cards
    const deck1 = await createDeck('Spanish')
    await createCard(deck1.id, 'Q1', 'A1')
    await createCard(deck1.id, 'Q2', 'A2')
    await createCard(deck1.id, 'Q3', 'A3')

    // Create second deck with cards
    const deck2 = await createDeck('French')
    await createCard(deck2.id, 'Q1', 'A1')
    await createCard(deck2.id, 'Q2', 'A2')

    // Create third deck with no cards
    const deck3 = await createDeck('Italian')

    // Verify all decks are listed with correct card counts
    const allDecks = await getAllDecks()
    expect(allDecks).toHaveLength(3)

    const spanish = allDecks.find((d) => d.name === 'Spanish')
    expect(spanish!.cardCount).toBe(3)

    const french = allDecks.find((d) => d.name === 'French')
    expect(french!.cardCount).toBe(2)

    const italian = allDecks.find((d) => d.name === 'Italian')
    expect(italian!.cardCount).toBe(0)
  })

  it('should persist data across simulated page refresh', async () => {
    // Create deck and add cards
    const deck = await createDeck('Test Deck')
    await createCard(deck.id, 'Q1', 'A1')
    await createCard(deck.id, 'Q2', 'A2')

    // Simulate page refresh - data should still be available
    const decks = await getAllDecks()
    expect(decks).toHaveLength(1)
    expect(decks[0].cardCount).toBe(2)

    const cards = await getCardsByDeck(deck.id)
    expect(cards).toHaveLength(2)
    expect(cards[0].frontText).toBe('Q1')
    expect(cards[1].frontText).toBe('Q2')
  })

  it('should maintain card order within deck', async () => {
    const deck = await createDeck('Ordered Deck')

    // Add cards in specific order
    const cards = []
    for (let i = 1; i <= 5; i++) {
      const card = await createCard(deck.id, `Q${i}`, `A${i}`)
      cards.push(card)
    }

    // Retrieve and verify order is preserved
    const retrieved = await getCardsByDeck(deck.id)
    expect(retrieved).toHaveLength(5)

    for (let i = 0; i < 5; i++) {
      expect(retrieved[i].order).toBe(i)
      expect(retrieved[i].frontText).toBe(`Q${i + 1}`)
    }
  })

  it('should support special characters in card text', async () => {
    const deck = await createDeck('Special Characters')

    const card = await createCard(
      deck.id,
      '¿Cómo estás? (How are you?)',
      '¡Muy bien! (Very good!)'
    )

    expect(card.frontText).toContain('¿')
    expect(card.frontText).toContain('?')
    expect(card.backText).toContain('¡')
    expect(card.backText).toContain('!')

    const retrieved = await getCardsByDeck(deck.id)
    expect(retrieved[0].frontText).toBe('¿Cómo estás? (How are you?)')
    expect(retrieved[0].backText).toBe('¡Muy bien! (Very good!)')
  })

  it('should handle long text content correctly', async () => {
    const deck = await createDeck('Long Text')

    const longFront = 'A'.repeat(500) // Max length
    const longBack = 'B'.repeat(500)

    const card = await createCard(deck.id, longFront, longBack)

    expect(card.frontText).toBe(longFront)
    expect(card.backText).toBe(longBack)

    const retrieved = await getCardsByDeck(deck.id)
    expect(retrieved[0].frontText).toBe(longFront)
  })
})
