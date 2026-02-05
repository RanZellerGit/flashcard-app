/**
 * Unit tests for Dashboard component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Dashboard } from '@/components/Dashboard'
import * as StorageModule from '@/lib/storage'

// Mock storage module
vi.mock('@/lib/storage', () => ({
  getAllDecks: vi.fn(),
  deleteDeck: vi.fn(),
}))

describe('Dashboard Component', () => {
  const mockCreateDeck = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render dashboard header', () => {
    vi.mocked(StorageModule.getAllDecks).mockResolvedValue([])

    render(<Dashboard onCreateDeck={mockCreateDeck} />)

    expect(screen.getByText('Flashcard App')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create new deck/i })).toBeInTheDocument()
  })

  it('should show loading state initially', () => {
    vi.mocked(StorageModule.getAllDecks).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    )

    render(<Dashboard onCreateDeck={mockCreateDeck} />)

    expect(screen.getByText(/loading your decks/i)).toBeInTheDocument()
  })

  it('should display decks after loading', async () => {
    const mockDecks = [
      {
        id: '1',
        name: 'Spanish',
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        cardCount: 10,
      },
      {
        id: '2',
        name: 'French',
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        cardCount: 5,
      },
    ]

    vi.mocked(StorageModule.getAllDecks).mockResolvedValue(mockDecks)

    render(<Dashboard onCreateDeck={mockCreateDeck} />)

    await waitFor(() => {
      expect(screen.getByText('Spanish')).toBeInTheDocument()
      expect(screen.getByText('French')).toBeInTheDocument()
    })
  })

  it('should show empty state when no decks', async () => {
    vi.mocked(StorageModule.getAllDecks).mockResolvedValue([])

    render(<Dashboard onCreateDeck={mockCreateDeck} />)

    await waitFor(() => {
      expect(screen.getByText(/no decks yet/i)).toBeInTheDocument()
      expect(screen.getByText(/create your first flashcard deck/i)).toBeInTheDocument()
    })
  })

  it('should display deck count', async () => {
    const mockDecks = [
      {
        id: '1',
        name: 'Deck 1',
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        cardCount: 10,
      },
      {
        id: '2',
        name: 'Deck 2',
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        cardCount: 5,
      },
      {
        id: '3',
        name: 'Deck 3',
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        cardCount: 3,
      },
    ]

    vi.mocked(StorageModule.getAllDecks).mockResolvedValue(mockDecks)

    render(<Dashboard onCreateDeck={mockCreateDeck} />)

    await waitFor(() => {
      expect(screen.getByText('3 decks total')).toBeInTheDocument()
    })
  })

  it('should call onCreateDeck when create button clicked', async () => {
    vi.mocked(StorageModule.getAllDecks).mockResolvedValue([])

    render(<Dashboard onCreateDeck={mockCreateDeck} />)

    const createButton = screen.getByRole('button', {
      name: /create your first deck/i,
    })
    createButton.click()

    expect(mockCreateDeck).toHaveBeenCalled()
  })

  it('should reload decks when refreshTrigger changes', async () => {
    const mockDecks = [
      {
        id: '1',
        name: 'Initial',
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        cardCount: 5,
      },
    ]

    vi.mocked(StorageModule.getAllDecks).mockResolvedValue(mockDecks)

    const { rerender } = render(
      <Dashboard onCreateDeck={mockCreateDeck} refreshTrigger={0} />
    )

    await waitFor(() => {
      expect(screen.getByText('Initial')).toBeInTheDocument()
    })

    expect(vi.mocked(StorageModule.getAllDecks)).toHaveBeenCalledTimes(1)

    // Rerender with new trigger
    const newMockDecks = [
      ...mockDecks,
      {
        id: '2',
        name: 'New Deck',
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        cardCount: 0,
      },
    ]

    vi.mocked(StorageModule.getAllDecks).mockResolvedValue(newMockDecks)

    rerender(<Dashboard onCreateDeck={mockCreateDeck} refreshTrigger={1} />)

    await waitFor(() => {
      expect(vi.mocked(StorageModule.getAllDecks)).toHaveBeenCalledTimes(2)
    })
  })
})
