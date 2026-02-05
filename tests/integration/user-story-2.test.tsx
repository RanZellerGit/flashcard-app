/**
 * Integration tests for User Story 2: View and Manage Decks from Dashboard
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  initializeStorage,
  createDeck,
  createCard,
  getAllDecks,
  deleteDeck,
  getDeck,
} from '@/lib/storage'

describe('User Story 2: View and Manage Decks from Dashboard', () => {
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

  it('should display all created decks on dashboard', async () => {
    // Create multiple decks
    const deck1 = await createDeck('Spanish')
    const deck2 = await createDeck('French')
    const deck3 = await createDeck('Italian')

    // Verify all decks are listed
    const allDecks = await getAllDecks()
    expect(allDecks).toHaveLength(3)
    expect(allDecks.map((d) => d.name)).toContain('Spanish')
    expect(allDecks.map((d) => d.name)).toContain('French')
    expect(allDecks.map((d) => d.name)).toContain('Italian')
  })

  it('should show deck name and card count', async () => {
    const deck = await createDeck('Test Deck')
    await createCard(deck.id, 'Q1', 'A1')
    await createCard(deck.id, 'Q2', 'A2')
    await createCard(deck.id, 'Q3', 'A3')

    const decks = await getAllDecks()
    const foundDeck = decks.find((d) => d.id === deck.id)

    expect(foundDeck).toBeDefined()
    expect(foundDeck!.name).toBe('Test Deck')
    expect(foundDeck!.cardCount).toBe(3)
  })

  it('should show empty state when no decks exist', async () => {
    const decks = await getAllDecks()
    expect(decks).toHaveLength(0)
  })

  it('should allow selecting a deck from dashboard', async () => {
    const deck1 = await createDeck('Deck 1')
    const deck2 = await createDeck('Deck 2')

    // Simulate user selecting a deck
    const allDecks = await getAllDecks()
    const selectedDeck = allDecks.find((d) => d.name === 'Deck 1')

    expect(selectedDeck).toBeDefined()
    expect(selectedDeck!.id).toBe(deck1.id)
  })

  it('should display decks in reverse creation order (newest first)', async () => {
    const deck1 = await createDeck('First Deck')
    await new Promise((resolve) => setTimeout(resolve, 10))
    const deck2 = await createDeck('Second Deck')
    await new Promise((resolve) => setTimeout(resolve, 10))
    const deck3 = await createDeck('Third Deck')

    const allDecks = await getAllDecks()

    expect(allDecks[0].id).toBe(deck3.id)
    expect(allDecks[1].id).toBe(deck2.id)
    expect(allDecks[2].id).toBe(deck1.id)
  })

  it('should allow deleting a deck from dashboard', async () => {
    const deck1 = await createDeck('To Delete')
    const deck2 = await createDeck('To Keep')

    // Verify both decks exist
    let allDecks = await getAllDecks()
    expect(allDecks).toHaveLength(2)

    // Delete deck1
    await deleteDeck(deck1.id)

    // Verify only deck2 remains
    allDecks = await getAllDecks()
    expect(allDecks).toHaveLength(1)
    expect(allDecks[0].id).toBe(deck2.id)
  })

  it('should update card count when navigating to deck', async () => {
    const deck = await createDeck('Test Deck')
    let allDecks = await getAllDecks()
    expect(allDecks[0].cardCount).toBe(0)

    // Add cards to deck
    await createCard(deck.id, 'Q1', 'A1')
    await createCard(deck.id, 'Q2', 'A2')

    // Verify card count updated
    const updatedDeck = await getDeck(deck.id)
    expect(updatedDeck!.cardCount).toBe(2)

    allDecks = await getAllDecks()
    expect(allDecks[0].cardCount).toBe(2)
  })

  it('should allow navigating between different decks', async () => {
    const deck1 = await createDeck('Deck 1')
    const deck2 = await createDeck('Deck 2')

    // Add different number of cards to each
    await createCard(deck1.id, 'Q1', 'A1')
    await createCard(deck1.id, 'Q2', 'A2')
    await createCard(deck2.id, 'Q1', 'A1')

    // Navigate to deck1
    let currentDeck = await getDeck(deck1.id)
    expect(currentDeck!.cardCount).toBe(2)

    // Navigate to deck2
    currentDeck = await getDeck(deck2.id)
    expect(currentDeck!.cardCount).toBe(1)

    // Navigate back to deck1
    currentDeck = await getDeck(deck1.id)
    expect(currentDeck!.cardCount).toBe(2)
  })

  it('should show empty state message for decks without cards', async () => {
    const deck1 = await createDeck('Empty Deck')
    const deck2 = await createDeck('Deck With Cards')
    await createCard(deck2.id, 'Q', 'A')

    const allDecks = await getAllDecks()

    const emptyDeck = allDecks.find((d) => d.id === deck1.id)
    const filledDeck = allDecks.find((d) => d.id === deck2.id)

    expect(emptyDeck!.cardCount).toBe(0)
    expect(filledDeck!.cardCount).toBe(1)
  })

  it('should maintain dashboard state after operations', async () => {
    // Create initial decks
    const deck1 = await createDeck('Deck 1')
    const deck2 = await createDeck('Deck 2')
    const deck3 = await createDeck('Deck 3')

    // Verify initial state
    let allDecks = await getAllDecks()
    expect(allDecks).toHaveLength(3)

    // Add cards to deck2
    await createCard(deck2.id, 'Q', 'A')

    // Delete deck1
    await deleteDeck(deck1.id)

    // Verify final state
    allDecks = await getAllDecks()
    expect(allDecks).toHaveLength(2)
    expect(allDecks.map((d) => d.id)).toContain(deck2.id)
    expect(allDecks.map((d) => d.id)).toContain(deck3.id)

    const deck2Updated = allDecks.find((d) => d.id === deck2.id)
    expect(deck2Updated!.cardCount).toBe(1)
  })

  it('should handle multiple rapid deck operations', async () => {
    // Create multiple decks rapidly
    const decks = await Promise.all([
      createDeck('Deck 1'),
      createDeck('Deck 2'),
      createDeck('Deck 3'),
      createDeck('Deck 4'),
      createDeck('Deck 5'),
    ])

    const allDecks = await getAllDecks()
    expect(allDecks).toHaveLength(5)

    // Delete multiple decks
    await Promise.all([
      deleteDeck(decks[0].id),
      deleteDeck(decks[2].id),
      deleteDeck(decks[4].id),
    ])

    const remainingDecks = await getAllDecks()
    expect(remainingDecks).toHaveLength(2)
    expect(remainingDecks.map((d) => d.id)).toContain(decks[1].id)
    expect(remainingDecks.map((d) => d.id)).toContain(decks[3].id)
  })
})
