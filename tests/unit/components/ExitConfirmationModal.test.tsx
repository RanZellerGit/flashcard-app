/**
 * Unit tests for ExitConfirmationModal component
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExitConfirmationModal } from '@/components/ExitConfirmationModal'

describe('ExitConfirmationModal Component', () => {
  const mockOnResume = vi.fn()
  const mockOnExit = vi.fn()

  it('should not render when isOpen is false', () => {
    render(
      <ExitConfirmationModal
        isOpen={false}
        deckName="Test Deck"
        currentCardIndex={0}
        totalCards={10}
        onResume={mockOnResume}
        onExit={mockOnExit}
      />
    )

    expect(screen.queryByText('Exit Study Mode?')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    render(
      <ExitConfirmationModal
        isOpen={true}
        deckName="Test Deck"
        currentCardIndex={0}
        totalCards={10}
        onResume={mockOnResume}
        onExit={mockOnExit}
      />
    )

    expect(screen.getByText('Exit Study Mode?')).toBeInTheDocument()
  })

  it('should display deck name and current position', () => {
    render(
      <ExitConfirmationModal
        isOpen={true}
        deckName="Biology 101"
        currentCardIndex={4}
        totalCards={20}
        onResume={mockOnResume}
        onExit={mockOnExit}
      />
    )

    expect(screen.getByText(/You're on card 5 of 20 in Biology 101/)).toBeInTheDocument()
  })

  it('should display correct position for first card', () => {
    render(
      <ExitConfirmationModal
        isOpen={true}
        deckName="Test Deck"
        currentCardIndex={0}
        totalCards={10}
        onResume={mockOnResume}
        onExit={mockOnExit}
      />
    )

    expect(screen.getByText(/You're on card 1 of 10/)).toBeInTheDocument()
  })

  it('should display correct position for last card', () => {
    render(
      <ExitConfirmationModal
        isOpen={true}
        deckName="Test Deck"
        currentCardIndex={9}
        totalCards={10}
        onResume={mockOnResume}
        onExit={mockOnExit}
      />
    )

    expect(screen.getByText(/You're on card 10 of 10/)).toBeInTheDocument()
  })

  it('should show progress save message', () => {
    render(
      <ExitConfirmationModal
        isOpen={true}
        deckName="Test Deck"
        currentCardIndex={2}
        totalCards={10}
        onResume={mockOnResume}
        onExit={mockOnExit}
      />
    )

    expect(
      screen.getByText(/Your progress will be saved/)
    ).toBeInTheDocument()
  })

  it('should call onResume when Keep Studying clicked', () => {
    render(
      <ExitConfirmationModal
        isOpen={true}
        deckName="Test Deck"
        currentCardIndex={0}
        totalCards={10}
        onResume={mockOnResume}
        onExit={mockOnExit}
      />
    )

    const keepButton = screen.getByText('Keep Studying')
    fireEvent.click(keepButton)

    expect(mockOnResume).toHaveBeenCalled()
  })

  it('should call onExit when Exit clicked', () => {
    render(
      <ExitConfirmationModal
        isOpen={true}
        deckName="Test Deck"
        currentCardIndex={0}
        totalCards={10}
        onResume={mockOnResume}
        onExit={mockOnExit}
      />
    )

    const exitButton = screen.getByText('Exit')
    fireEvent.click(exitButton)

    expect(mockOnExit).toHaveBeenCalled()
  })

  it('should have both buttons in modal', () => {
    render(
      <ExitConfirmationModal
        isOpen={true}
        deckName="Test Deck"
        currentCardIndex={0}
        totalCards={10}
        onResume={mockOnResume}
        onExit={mockOnExit}
      />
    )

    expect(screen.getByText('Keep Studying')).toBeInTheDocument()
    expect(screen.getByText('Exit')).toBeInTheDocument()
  })

  it('should handle different deck names', () => {
    const { rerender } = render(
      <ExitConfirmationModal
        isOpen={true}
        deckName="Math Advanced"
        currentCardIndex={0}
        totalCards={10}
        onResume={mockOnResume}
        onExit={mockOnExit}
      />
    )

    expect(screen.getByText(/Math Advanced/)).toBeInTheDocument()

    rerender(
      <ExitConfirmationModal
        isOpen={true}
        deckName="History Timeline"
        currentCardIndex={0}
        totalCards={10}
        onResume={mockOnResume}
        onExit={mockOnExit}
      />
    )

    expect(screen.getByText(/History Timeline/)).toBeInTheDocument()
    expect(screen.queryByText(/Math Advanced/)).not.toBeInTheDocument()
  })
})
