/**
 * Unit tests for StudyCard component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StudyCard } from '@/components/StudyCard'
import { Flashcard } from '@/lib/types'

describe('StudyCard Component', () => {
  const mockCard: Flashcard = {
    id: 'card-1',
    deckId: 'deck-1',
    frontText: 'What is 2+2?',
    backText: '4',
    order: 0,
    createdDate: new Date().toISOString(),
  }

  it('should display front text initially', () => {
    render(
      <StudyCard
        card={mockCard}
        cardIndex={0}
        cardCount={10}
      />
    )

    expect(screen.getByText('What is 2+2?')).toBeInTheDocument()
    expect(screen.getByText('Question')).toBeInTheDocument()
  })

  it('should display back text after flip', async () => {
    render(
      <StudyCard
        card={mockCard}
        cardIndex={0}
        cardCount={10}
      />
    )

    const cardElement = screen.getByText('What is 2+2?').closest('div')?.parentElement?.parentElement
    fireEvent.click(cardElement!)

    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument()
    })
  })

  it('should toggle between front and back on click', async () => {
    render(
      <StudyCard
        card={mockCard}
        cardIndex={0}
        cardCount={10}
      />
    )

    const cardElement = screen.getByText('What is 2+2?').closest('div')?.parentElement?.parentElement

    // Click to flip to back
    fireEvent.click(cardElement!)
    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument()
    })

    // Click to flip back to front
    fireEvent.click(cardElement!)
    await waitFor(() => {
      expect(screen.getByText('What is 2+2?')).toBeInTheDocument()
    })
  })

  it('should display progress indicator', () => {
    render(
      <StudyCard
        card={mockCard}
        cardIndex={2}
        cardCount={10}
      />
    )

    expect(screen.getByText('Card 3 of 10')).toBeInTheDocument()
  })

  it('should display correct card position', () => {
    const { rerender } = render(
      <StudyCard
        card={mockCard}
        cardIndex={0}
        cardCount={5}
      />
    )

    expect(screen.getByText('Card 1 of 5')).toBeInTheDocument()

    rerender(
      <StudyCard
        card={mockCard}
        cardIndex={4}
        cardCount={5}
      />
    )

    expect(screen.getByText('Card 5 of 5')).toBeInTheDocument()
  })

  it('should call onFlip callback when card clicked', async () => {
    const mockFlip = vi.fn()

    render(
      <StudyCard
        card={mockCard}
        cardIndex={0}
        cardCount={10}
        onFlip={mockFlip}
      />
    )

    const cardElement = screen.getByText('What is 2+2?').closest('div')?.parentElement?.parentElement
    fireEvent.click(cardElement!)

    await waitFor(() => {
      expect(mockFlip).toHaveBeenCalled()
    })
  })

  it('should reset flip state when card changes', async () => {
    const card2: Flashcard = {
      ...mockCard,
      id: 'card-2',
      frontText: 'What is 3+3?',
      backText: '6',
      order: 1,
    }

    const { rerender } = render(
      <StudyCard
        card={mockCard}
        cardIndex={0}
        cardCount={10}
      />
    )

    // Flip to back
    const cardElement = screen.getByText('What is 2+2?').closest('div')?.parentElement?.parentElement
    fireEvent.click(cardElement!)

    // Change card
    rerender(
      <StudyCard
        card={card2}
        cardIndex={1}
        cardCount={10}
      />
    )

    // Should show front text of new card
    await waitFor(() => {
      expect(screen.getByText('What is 3+3?')).toBeInTheDocument()
    })
  })

  it('should display helpful hint text', () => {
    render(
      <StudyCard
        card={mockCard}
        cardIndex={0}
        cardCount={10}
      />
    )

    expect(screen.getByText('Click card to reveal answer')).toBeInTheDocument()
  })

  it('should show progress bar', () => {
    render(
      <StudyCard
        card={mockCard}
        cardIndex={3}
        cardCount={10}
      />
    )

    // Progress should be at 40% (4/10)
    const progressBar = screen.getByText('Card 4 of 10').closest('div')
      ?.querySelector('[style*="width"]')
    expect(progressBar).toBeInTheDocument()
  })

  it('should handle long text in card', () => {
    const longCard: Flashcard = {
      ...mockCard,
      frontText: 'A'.repeat(200),
      backText: 'B'.repeat(200),
    }

    render(
      <StudyCard
        card={longCard}
        cardIndex={0}
        cardCount={10}
      />
    )

    expect(screen.getByText('A'.repeat(200))).toBeInTheDocument()
  })
})
