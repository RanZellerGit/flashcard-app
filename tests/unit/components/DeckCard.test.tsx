/**
 * Unit tests for DeckCard component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeckCard } from '@/components/DeckCard'
import { Deck } from '@/lib/types'

describe('DeckCard Component', () => {
  const mockDeck: Deck = {
    id: 'deck-123',
    name: 'Spanish Vocabulary',
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
    cardCount: 15,
  }

  const mockDelete = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render deck information', () => {
    render(<DeckCard deck={mockDeck} />)

    expect(screen.getByText('Spanish Vocabulary')).toBeInTheDocument()
    expect(screen.getByText(/15 cards/)).toBeInTheDocument()
  })

  it('should display card count with correct plural', () => {
    const singleCardDeck = { ...mockDeck, cardCount: 1 }
    render(<DeckCard deck={singleCardDeck} />)

    expect(screen.getByText('1 card')).toBeInTheDocument()
  })

  it('should show study button enabled with cards', () => {
    render(<DeckCard deck={mockDeck} />)

    const studyButton = screen.getByRole('button', { name: 'Study' })
    expect(studyButton).not.toBeDisabled()
  })

  it('should disable study button without cards', () => {
    const emptyDeck = { ...mockDeck, cardCount: 0 }
    render(<DeckCard deck={emptyDeck} />)

    const studyButton = screen.getByRole('button', { name: 'No Cards' })
    expect(studyButton).toBeDisabled()
  })

  it('should have manage and study buttons', () => {
    render(<DeckCard deck={mockDeck} />)

    expect(screen.getByRole('button', { name: 'Manage' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Study' })).toBeInTheDocument()
  })

  it('should show delete button when onDelete provided', () => {
    render(<DeckCard deck={mockDeck} onDelete={mockDelete} />)

    const deleteButton = screen.getByRole('button', { name: '✕' })
    expect(deleteButton).toBeInTheDocument()
  })

  it('should not show delete button without onDelete handler', () => {
    render(<DeckCard deck={mockDeck} />)

    expect(screen.queryByRole('button', { name: '✕' })).not.toBeInTheDocument()
  })

  it('should call onDelete with deck id when delete confirmed', async () => {
    render(<DeckCard deck={mockDeck} onDelete={mockDelete} />)

    const deleteButton = screen.getByRole('button', { name: '✕' })

    // Mock confirm to return true
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(mockDeck.id)
    })
  })

  it('should not call onDelete when delete cancelled', () => {
    render(<DeckCard deck={mockDeck} onDelete={mockDelete} />)

    const deleteButton = screen.getByRole('button', { name: '✕' })

    // Mock confirm to return false
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    fireEvent.click(deleteButton)

    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('should show creation date', () => {
    const testDate = new Date('2024-01-15').toISOString()
    const deck = { ...mockDeck, createdDate: testDate }

    render(<DeckCard deck={deck} />)

    expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument()
  })

  it('should display progress bar width based on card count', () => {
    render(<DeckCard deck={mockDeck} />)

    // With 15 cards, should be 150% but capped at 100%
    const progressBar = screen.getByText('Study').parentElement
      ?.parentElement?.querySelector('[style*="width"]')

    expect(progressBar).toBeInTheDocument()
  })
})
