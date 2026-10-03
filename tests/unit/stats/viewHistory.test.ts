import { describe, it, expect, vi } from 'vitest'

// lib/db opens a Neon connection at import time; the pure helpers under test never touch it.
vi.mock('@/lib/db', () => ({ db: {} }))
import { lastDays, buildViewHistories } from '@/lib/stats/viewHistory'

describe('lastDays', () => {
  it('returns the requested number of UTC dates, oldest first, ending today', () => {
    const now = new Date('2026-10-03T12:00:00Z')
    const days = lastDays(3, now)
    expect(days).toEqual(['2026-10-01', '2026-10-02', '2026-10-03'])
  })

  it('defaults to 14 days', () => {
    expect(lastDays()).toHaveLength(14)
  })
})

describe('buildViewHistories', () => {
  const days = ['2026-10-01', '2026-10-02', '2026-10-03']

  it('zero-fills users with no rows', () => {
    const result = buildViewHistories(['u1'], [], days)
    expect(result.get('u1')).toEqual({ daily: [0, 0, 0], total: 0 })
  })

  it('places counts in the right day slot and sums the total', () => {
    const rows = [
      { userId: 'u1', date: '2026-10-01', count: 5 },
      { userId: 'u1', date: '2026-10-03', count: 7 },
      { userId: 'u2', date: '2026-10-02', count: 2 },
    ]
    const result = buildViewHistories(['u1', 'u2'], rows, days)
    expect(result.get('u1')).toEqual({ daily: [5, 0, 7], total: 12 })
    expect(result.get('u2')).toEqual({ daily: [0, 2, 0], total: 2 })
  })

  it('ignores rows for unknown users or dates outside the window', () => {
    const rows = [
      { userId: 'ghost', date: '2026-10-01', count: 9 },
      { userId: 'u1', date: '2026-09-30', count: 9 },
    ]
    const result = buildViewHistories(['u1'], rows, days)
    expect(result.get('u1')).toEqual({ daily: [0, 0, 0], total: 0 })
    expect(result.has('ghost')).toBe(false)
  })
})
