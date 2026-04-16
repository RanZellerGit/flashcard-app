const STORAGE_KEY = 'cards_viewed_today'

interface DailyStats {
  date: string
  count: number
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
}

export function getCardsViewedToday(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return 0
    const stats: DailyStats = JSON.parse(raw)
    return stats.date === todayString() ? stats.count : 0
  } catch {
    return 0
  }
}

export function incrementCardsViewedToday(): void {
  if (typeof window === 'undefined') return
  try {
    const today = todayString()
    const raw = localStorage.getItem(STORAGE_KEY)
    let stats: DailyStats = { date: today, count: 0 }
    if (raw) {
      const parsed: DailyStats = JSON.parse(raw)
      stats = parsed.date === today ? parsed : { date: today, count: 0 }
    }
    stats.count += 1
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    // localStorage may be unavailable (private mode, quota exceeded)
  }
}
