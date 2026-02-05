/**
 * Utility functions for Flashcard Application
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a unique ID for decks and cards
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Format date to ISO string
 */
export function formatDate(date: Date = new Date()): string {
  return date.toISOString()
}

/**
 * Validate deck name
 */
export function validateDeckName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length > 0 && trimmed.length <= 200
}

/**
 * Validate flashcard text (front or back)
 */
export function validateCardText(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.length > 0 && trimmed.length <= 500
}

/**
 * Trim and validate a string field
 */
export function sanitizeInput(input: string): string {
  return input.trim()
}

/**
 * Parse ISO string to Date
 */
export function parseDate(isoString: string): Date {
  return new Date(isoString)
}

/**
 * Check if a value is a valid UUID-like string
 */
export function isValidId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0
}
