/**
 * Increments the user's viewed-today counter in the database.
 * Fire-and-forget — does not block the calling action.
 */
export function incrementCardsViewedToday(): void {
  fetch('/api/stats/viewed', { method: 'POST' }).catch(() => {
    // Non-critical: silently ignore network errors
  })
}
