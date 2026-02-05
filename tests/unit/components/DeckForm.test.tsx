/**
 * Unit tests for DeckForm component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeckForm } from '@/components/DeckForm'

describe('DeckForm Component', () => {
  it('should render form for creating new deck', () => {
    const mockSubmit = vi.fn()
    const mockCancel = vi.fn()

    render(
      <DeckForm onSubmit={mockSubmit} onCancel={mockCancel} />
    )

    expect(screen.getByLabelText(/deck name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
  })

  it('should render form for editing existing deck', () => {
    const mockSubmit = vi.fn()
    const mockCancel = vi.fn()

    render(
      <DeckForm
        initialDeck={{ id: '1', name: 'Spanish' }}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />
    )

    expect(screen.getByDisplayValue('Spanish')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
  })

  it('should display character count', () => {
    const mockSubmit = vi.fn()
    const mockCancel = vi.fn()

    render(
      <DeckForm onSubmit={mockSubmit} onCancel={mockCancel} />
    )

    const input = screen.getByLabelText(/deck name/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Test' } })

    expect(screen.getByText('4/200 characters')).toBeInTheDocument()
  })

  it('should validate non-empty name', async () => {
    const mockSubmit = vi.fn()
    const mockCancel = vi.fn()

    render(
      <DeckForm onSubmit={mockSubmit} onCancel={mockCancel} />
    )

    const submitButton = screen.getByRole('button', { name: /create/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/deck name must be 1-200 characters/i)
      ).toBeInTheDocument()
    })

    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('should call onSubmit with deck name', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined)
    const mockCancel = vi.fn()

    render(
      <DeckForm onSubmit={mockSubmit} onCancel={mockCancel} />
    )

    const input = screen.getByLabelText(/deck name/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Spanish Vocabulary' } })

    const submitButton = screen.getByRole('button', { name: /create/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('Spanish Vocabulary')
    })
  })

  it('should call onCancel when cancel button clicked', () => {
    const mockSubmit = vi.fn()
    const mockCancel = vi.fn()

    render(
      <DeckForm onSubmit={mockSubmit} onCancel={mockCancel} />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockCancel).toHaveBeenCalled()
  })

  it('should show loading state', () => {
    const mockSubmit = vi.fn()
    const mockCancel = vi.fn()

    render(
      <DeckForm onSubmit={mockSubmit} onCancel={mockCancel} isLoading={true} />
    )

    expect(screen.getByLabelText(/deck name/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /create/i })).toBeDisabled()
  })

  it('should disable submit while submitting', async () => {
    const mockSubmit = vi.fn(
      () =>
        new Promise((resolve) =>
          setTimeout(resolve, 100)
        )
    )
    const mockCancel = vi.fn()

    render(
      <DeckForm onSubmit={mockSubmit} onCancel={mockCancel} />
    )

    const input = screen.getByLabelText(/deck name/i)
    fireEvent.change(input, { target: { value: 'Test' } })

    const submitButton = screen.getByRole('button', { name: /create/i })
    fireEvent.click(submitButton)

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })
})
