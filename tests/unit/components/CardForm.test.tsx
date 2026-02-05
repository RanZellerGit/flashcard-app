/**
 * Unit tests for CardForm component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CardForm } from '@/components/CardForm'

describe('CardForm Component', () => {
  const mockSubmit = vi.fn().mockResolvedValue(undefined)
  const mockCancel = vi.fn()
  const deckId = 'test-deck-id'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render form for creating new card', () => {
    render(
      <CardForm deckId={deckId} onSubmit={mockSubmit} onCancel={mockCancel} />
    )

    expect(screen.getByLabelText(/front \(question\)/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/back \(answer\)/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add card/i })).toBeInTheDocument()
  })

  it('should render form for editing card', () => {
    const initialCard = {
      id: '1',
      frontText: 'What is 2+2?',
      backText: '4',
    }

    render(
      <CardForm
        deckId={deckId}
        initialCard={initialCard}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />
    )

    expect(screen.getByDisplayValue('What is 2+2?')).toBeInTheDocument()
    expect(screen.getByDisplayValue('4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
  })

  it('should display character counts', () => {
    render(
      <CardForm deckId={deckId} onSubmit={mockSubmit} onCancel={mockCancel} />
    )

    const frontInput = screen.getByLabelText(/front/i) as HTMLTextAreaElement
    const backInput = screen.getByLabelText(/back/i) as HTMLTextAreaElement

    fireEvent.change(frontInput, { target: { value: 'Test front' } })
    fireEvent.change(backInput, { target: { value: 'Test back' } })

    expect(screen.getByText('10/500 characters')).toBeInTheDocument()
    expect(screen.getAllByText('9/500 characters')).toHaveLength(1)
  })

  it('should validate empty front text', async () => {
    render(
      <CardForm deckId={deckId} onSubmit={mockSubmit} onCancel={mockCancel} />
    )

    const backInput = screen.getByLabelText(/back/i)
    fireEvent.change(backInput, { target: { value: 'Answer' } })

    const submitButton = screen.getByRole('button', { name: /add card/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/front text must be 1-500 characters/i)
      ).toBeInTheDocument()
    })

    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('should validate empty back text', async () => {
    render(
      <CardForm deckId={deckId} onSubmit={mockSubmit} onCancel={mockCancel} />
    )

    const frontInput = screen.getByLabelText(/front/i)
    fireEvent.change(frontInput, { target: { value: 'Question' } })

    const submitButton = screen.getByRole('button', { name: /add card/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/back text must be 1-500 characters/i)
      ).toBeInTheDocument()
    })

    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('should call onSubmit with card texts', async () => {
    render(
      <CardForm deckId={deckId} onSubmit={mockSubmit} onCancel={mockCancel} />
    )

    const frontInput = screen.getByLabelText(/front/i)
    const backInput = screen.getByLabelText(/back/i)

    fireEvent.change(frontInput, { target: { value: 'Question?' } })
    fireEvent.change(backInput, { target: { value: 'Answer' } })

    const submitButton = screen.getByRole('button', { name: /add card/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('Question?', 'Answer')
    })
  })

  it('should call onCancel when cancel button clicked', () => {
    render(
      <CardForm deckId={deckId} onSubmit={mockSubmit} onCancel={mockCancel} />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockCancel).toHaveBeenCalled()
  })

  it('should show loading state', () => {
    render(
      <CardForm
        deckId={deckId}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
        isLoading={true}
      />
    )

    expect(screen.getByLabelText(/front/i)).toBeDisabled()
    expect(screen.getByLabelText(/back/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /add card/i })).toBeDisabled()
  })

  it('should trim whitespace from inputs', async () => {
    render(
      <CardForm deckId={deckId} onSubmit={mockSubmit} onCancel={mockCancel} />
    )

    const frontInput = screen.getByLabelText(/front/i)
    const backInput = screen.getByLabelText(/back/i)

    fireEvent.change(frontInput, { target: { value: '  Question?  ' } })
    fireEvent.change(backInput, { target: { value: '  Answer  ' } })

    const submitButton = screen.getByRole('button', { name: /add card/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('Question?', 'Answer')
    })
  })
})
