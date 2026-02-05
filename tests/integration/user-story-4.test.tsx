/**
 * Integration tests for User Story 4: Exit and Resume Deck Management
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

describe('User Story 4: Exit and Resume Deck Management', () => {
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

  it('should save session state when exiting study', async () => {
    const deck = await createDeck('Test Deck')
    const cards = await Promise.all([
      createCard(deck.id, 'Q1', 'A1'),
      createCard(deck.id, 'Q2', 'A2'),
      createCard(deck.id, 'Q3', 'A3'),
    ])

    // Set session at card 1, flipped
    await setSessionState({
      currentStudySession: {
        deckId: deck.id,
        cardIndex: 1,
        isFlipped: true,
      },
    })

    // Verify session is saved
    const session = getSessionState()
    expect(session.currentStudySession?.cardIndex).toBe(1)
    expect(session.currentStudySession?.isFlipped).toBe(true)
  })

  it('should allow resuming from saved session', async () => {
    const deck = await createDeck('Test Deck')
    const cards = await Promise.all([
      createCard(deck.id, 'Q1', 'A1'),
      createCard(deck.id, 'Q2', 'A2'),
      createCard(deck.id, 'Q3', 'A3'),
    ])

    // Save session
    await setSessionState({
      currentStudySession: {
        deckId: deck.id,
        cardIndex: 2,
        isFlipped: false,
      },
    })

    // Retrieve and verify
    const session = getSessionState()
    const allCards = await getCardsByDeck(deck.id)
    expect(allCards[session.currentStudySession!.cardIndex].frontText).toBe('Q3')
  })

  it('should handle switching between decks', async () => {
    const deck1 = await createDeck('Deck 1')
    const deck2 = await createDeck('Deck 2')

    const cards1 = await Promise.all([
      createCard(deck1.id, 'D1Q1', 'D1A1'),
      createCard(deck1.id, 'D1Q2', 'D1A2'),
    ])

    const cards2 = await Promise.all([
      createCard(deck2.id, 'D2Q1', 'D2A1'),
      createCard(deck2.id, 'D2Q2', 'D2A2'),
    ])

    // Study deck 1, card 1
    await setSessionState({
      currentStudySession: {
        deckId: deck1.id,
        cardIndex: 1,
        isFlipped: true,
      },
    })

    let session = getSessionState()
    expect(session.currentStudySession?.deckId).toBe(deck1.id)
    expect(session.currentStudySession?.cardIndex).toBe(1)

    // Switch to deck 2, card 0
    await setSessionState({
      currentStudySession: {
        deckId: deck2.id,
        cardIndex: 0,
        isFlipped: false,
      },
    })

    // Verify switch
    session = getSessionState()
    expect(session.currentStudySession?.deckId).toBe(deck2.id)
    expect(session.currentStudySession?.cardIndex).toBe(0)
  })

  it('should clear session when exiting deck', async () => {
    const deck = await createDeck('Test Deck')
    await createCard(deck.id, 'Q1', 'A1')

    // Set session
    await setSessionState({
      currentStudySession: {
        deckId: deck.id,
        cardIndex: 0,
        isFlipped: true,
      },
    })

    // Clear session
    await clearSessionState()

    // Verify cleared
    const session = getSessionState()
    expect(session.currentStudySession).toBeUndefined()
  })

  it('should preserve session for multiple sessions', async () => {
    const deck = await createDeck('Test Deck')
    const cards = await Promise.all([
      createCard(deck.id, 'Q1', 'A1'),
      createCard(deck.id, 'Q2', 'A2'),
      createCard(deck.id, 'Q3', 'A3'),
    ])

    // Session 1
    await setSessionState({
      currentStudySession: {
        deckId: deck.id,
        cardIndex: 0,
        isFlipped: false,
      },
    })

    let session = getSessionState()
    expect(session.currentStudySession?.cardIndex).toBe(0)

    // Update to session 2
    await setSessionState({
      currentStudySession: {
        deckId: deck.id,
        cardIndex: 1,
        isFlipped: true,
      },
    })

    session = getSessionState()
    expect(session.currentStudySession?.cardIndex).toBe(1)
    expect(session.currentStudySession?.isFlipped).toBe(true)

    // Update to session 3
    await setSessionState({
      currentStudySession: {
        deckId: deck.id,
        cardIndex: 2,
        isFlipped: false,
      },
    })

    session = getSessionState()
    expect(session.currentStudySession?.cardIndex).toBe(2)
  })

  it('should handle session state with empty session object', async () => {
    const deck = await createDeck('Test Deck')
    await createCard(deck.id, 'Q1', 'A1')

    // Set empty session
    await setSessionState({})

    // Verify empty
    const session = getSessionState()
    expect(session.currentStudySession).toBeUndefined()
  })

  it('should maintain session across multiple deck operations', async () => {
    const deck = await createDeck('Main Deck')
    const cards = await Promise.all([
      createCard(deck.id, 'Q1', 'A1'),
      createCard(deck.id, 'Q2', 'A2'),
      createCard(deck.id, 'Q3', 'A3'),
    ])

    // Start study session
    await setSessionState({
      currentStudySession: {
        deckId: deck.id,
        cardIndex: 1,
        isFlipped: true,
      },
    })

    // Verify session is present
    let session = getSessionState()
    expect(session.currentStudySession?.cardIndex).toBe(1)

    // Get deck info
    const deckData = await getDeck(deck.id)
    expect(deckData?.id).toBe(deck.id)

    // Session should still be there
    session = getSessionState()
    expect(session.currentStudySession?.cardIndex).toBe(1)
  })

  it('should track flip state across navigation', async () => {
    const deck = await createDeck('Test Deck')
    const cards = await Promise.all([
      createCard(deck.id, 'Q1', 'A1'),
      createCard(deck.id, 'Q2', 'A2'),
      createCard(deck.id, 'Q3', 'A3'),
    ])

    // Start at card 0, not flipped
    await setSessionState({
      currentStudySession: {
        deckId: deck.id,
        cardIndex: 0,
        isFlipped: false,
      },
    })

    let session = getSessionState()
    expect(session.currentStudySession?.isFlipped).toBe(false)

    // Move to card 1, flipped
    await setSessionState({
      currentStudySession: {
        deckId: deck.id,
        cardIndex: 1,
        isFlipped: true,
      },
    })

    session = getSessionState()
    expect(session.currentStudySession?.cardIndex).toBe(1)
    expect(session.currentStudySession?.isFlipped).toBe(true)

    // Move to card 2, not flipped
    await setSessionState({
      currentStudySession: {
        deckId: deck.id,
        cardIndex: 2,
        isFlipped: false,
      },
    })

    session = getSessionState()
    expect(session.currentStudySession?.cardIndex).toBe(2)
    expect(session.currentStudySession?.isFlipped).toBe(false)
  })

  it('should handle exit and re-entry to same deck', async () => {
    const deck = await createDeck('Test Deck')
    const cards = await Promise.all([
      createCard(deck.id, 'Q1', 'A1'),
      createCard(deck.id, 'Q2', 'A2'),
      createCard(deck.id, 'Q3', 'A3'),
    ])

    // Start study
    await setSessionState({
      currentStudySession: {
        deckId: deck.id,
        cardIndex: 1,
        isFlipped: true,
      },
    })

    // Exit
    await clearSessionState()
    let session = getSessionState()
    expect(session.currentStudySession).toBeUndefined()

    // Re-enter and continue from where we left
    await setSessionState({
      currentStudySession: {
        deckId: deck.id,
        cardIndex: 1,
        isFlipped: true,
      },
    })

    session = getSessionState()
    expect(session.currentStudySession?.cardIndex).toBe(1)
  })
})
