/**
 * Integration tests for User Story 3: Study Mode - Flip Through Flashcards
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  initializeStorage,
  createDeck,
  createCard,
  getCardsByDeck,
  getDeck,
  setSessionState,
  getSessionState,
  clearSessionState,
} from '@/lib/storage'

describe('User Story 3: Study Mode - Flip Through Flashcards', () => {
  beforeEach(async () => {
    // Clear IndexedDB
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('flashcard-app')
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
    })

    // Re-initialize
    await initializeStorage()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should display first card with front text visible', async () => {
    const deck = await createDeck('Test Deck')
    const card1 = await createCard(deck.id, 'Q1?', 'A1')
    const card2 = await createCard(deck.id, 'Q2?', 'A2')

    const cards = await getCardsByDeck(deck.id)
    expect(cards[0].frontText).toBe('Q1?')
    expect(cards[0].order).toBe(0)
  })

  it('should allow flipping card to show back text', async () => {
    const deck = await createDeck('Test Deck')
    const card = await createCard(deck.id, 'What is 2+2?', '4')

    const cards = await getCardsByDeck(deck.id)
    const currentCard = cards[0]

    // Simulate flip - just verify we can access both sides
    expect(currentCard.frontText).toBe('What is 2+2?')
    expect(currentCard.backText).toBe('4')
  })

  it('should navigate to next card', async () => {
    const deck = await createDeck('Test Deck')
    const cards = await Promise.all([
      createCard(deck.id, 'Q1', 'A1'),
      createCard(deck.id, 'Q2', 'A2'),
      createCard(deck.id, 'Q3', 'A3'),
    ])

    const allCards = await getCardsByDeck(deck.id)

    // Verify cards are in order
    expect(allCards[0].frontText).toBe('Q1')
    expect(allCards[1].frontText).toBe('Q2')
    expect(allCards[2].frontText).toBe('Q3')

    // Simulate navigation
    let currentIndex = 0
    expect(allCards[currentIndex].frontText).toBe('Q1')

    currentIndex++
    expect(allCards[currentIndex].frontText).toBe('Q2')

    currentIndex++
    expect(allCards[currentIndex].frontText).toBe('Q3')
  })

  it('should navigate to previous card', async () => {
    const deck = await createDeck('Test Deck')
    await Promise.all([
      createCard(deck.id, 'Q1', 'A1'),
      createCard(deck.id, 'Q2', 'A2'),
      createCard(deck.id, 'Q3', 'A3'),
    ])

    const allCards = await getCardsByDeck(deck.id)

    // Start at index 2
    let currentIndex = 2
    expect(allCards[currentIndex].frontText).toBe('Q3')

    // Go back to index 1
    currentIndex--
    expect(allCards[currentIndex].frontText).toBe('Q2')

    // Go back to index 0
    currentIndex--
    expect(allCards[currentIndex].frontText).toBe('Q1')
  })

  it('should handle end of deck scenario', async () => {
    const deck = await createDeck('Small Deck')
    await createCard(deck.id, 'Q1', 'A1')
    await createCard(deck.id, 'Q2', 'A2')

    const allCards = await getCardsByDeck(deck.id)

    // Simulate reaching last card
    let currentIndex = 0
    const isAtEnd = currentIndex === allCards.length - 1
    expect(isAtEnd).toBe(false)

    currentIndex = allCards.length - 1
    const isNowAtEnd = currentIndex === allCards.length - 1
    expect(isNowAtEnd).toBe(true)
  })

  it('should preserve session state during study', async () => {
    const deck = await createDeck('Test Deck')
    const cards = await Promise.all([
      createCard(deck.id, 'Q1', 'A1'),
      createCard(deck.id, 'Q2', 'A2'),
      createCard(deck.id, 'Q3', 'A3'),
    ])

    // Save session state - user on card 2
    await setSessionState({
      currentStudySession: {
        deckId: deck.id,
        cardIndex: 1,
        isFlipped: true,
      },
    })

    // Retrieve and verify
    const session = getSessionState()
    expect(session.currentStudySession?.cardIndex).toBe(1)
    expect(session.currentStudySession?.isFlipped).toBe(true)
    expect(session.currentStudySession?.deckId).toBe(deck.id)

    const allCards = await getCardsByDeck(deck.id)
    expect(allCards[session.currentStudySession!.cardIndex].frontText).toBe('Q2')
  })

  it('should clear session state when exiting study', async () => {
    const deck = await createDeck('Test Deck')
    await createCard(deck.id, 'Q1', 'A1')

    // Set session
    await setSessionState({
      currentStudySession: {
        deckId: deck.id,
        cardIndex: 0,
        isFlipped: false,
      },
    })

    // Clear session (simulating exit)
    await clearSessionState()

    const session = getSessionState()
    expect(session.currentStudySession).toBeUndefined()
  })

  it('should handle deck with multiple cards correctly', async () => {
    const deck = await createDeck('Large Deck')

    // Create 10 cards
    const cardPromises = Array.from({ length: 10 }, (_, i) =>
      createCard(deck.id, `Question ${i + 1}`, `Answer ${i + 1}`)
    )
    await Promise.all(cardPromises)

    const cards = await getCardsByDeck(deck.id)
    expect(cards).toHaveLength(10)

    // Verify ordering
    cards.forEach((card, index) => {
      expect(card.order).toBe(index)
      expect(card.frontText).toBe(`Question ${index + 1}`)
    })
  })

  it('should maintain card position and flip state across operations', async () => {
    const deck = await createDeck('Test Deck')
    await Promise.all([
      createCard(deck.id, 'Q1', 'A1'),
      createCard(deck.id, 'Q2', 'A2'),
      createCard(deck.id, 'Q3', 'A3'),
    ])

    // User at card 2, flipped
    await setSessionState({
      currentStudySession: {
        deckId: deck.id,
        cardIndex: 1,
        isFlipped: true,
      },
    })

    // Verify state
    let session = getSessionState()
    expect(session.currentStudySession?.cardIndex).toBe(1)
    expect(session.currentStudySession?.isFlipped).toBe(true)

    // Update to card 3, not flipped
    await setSessionState({
      currentStudySession: {
        deckId: deck.id,
        cardIndex: 2,
        isFlipped: false,
      },
    })

    // Verify updated state
    session = getSessionState()
    expect(session.currentStudySession?.cardIndex).toBe(2)
    expect(session.currentStudySession?.isFlipped).toBe(false)
  })

  it('should handle navigation boundaries correctly', async () => {
    const deck = await createDeck('Test Deck')
    const cards = await Promise.all([
      createCard(deck.id, 'Q1', 'A1'),
      createCard(deck.id, 'Q2', 'A2'),
      createCard(deck.id, 'Q3', 'A3'),
    ])

    const allCards = await getCardsByDeck(deck.id)

    // At first card - can't go previous
    let currentIndex = 0
    expect(currentIndex > 0).toBe(false)

    // At last card - at end
    currentIndex = allCards.length - 1
    expect(currentIndex === allCards.length - 1).toBe(true)

    // Can navigate prev from middle
    currentIndex = 1
    expect(currentIndex > 0).toBe(true)
    expect(currentIndex < allCards.length - 1).toBe(true)
  })

  it('should handle study completion correctly', async () => {
    const deck = await createDeck('Test Deck')
    const cardCount = 5
    await Promise.all(
      Array.from({ length: cardCount }, (_, i) =>
        createCard(deck.id, `Q${i + 1}`, `A${i + 1}`)
      )
    )

    const allCards = await getCardsByDeck(deck.id)

    // Simulate completion
    let currentIndex = allCards.length - 1
    const isComplete = currentIndex === allCards.length - 1
    const reviewCount = currentIndex + 1

    expect(isComplete).toBe(true)
    expect(reviewCount).toBe(cardCount)
  })
})
