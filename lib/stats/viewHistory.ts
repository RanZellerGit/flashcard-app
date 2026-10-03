import { db } from '@/lib/db'
import { dailyViews } from '@/lib/db/schema'
import { and, gte, inArray } from 'drizzle-orm'

export const HISTORY_DAYS = 14

export interface ViewHistory {
  /** Per-day counts for the last HISTORY_DAYS days (UTC), oldest first. */
  daily: number[]
  /** Sum of `daily`. */
  total: number
}

function dateString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** The last `days` UTC dates as 'YYYY-MM-DD', oldest first. */
export function lastDays(days = HISTORY_DAYS, now = new Date()): string[] {
  const out: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    out.push(dateString(d))
  }
  return out
}

/** Fold raw (userId, date, count) rows into per-user histories over `days`. */
export function buildViewHistories(
  userIds: readonly string[],
  rows: ReadonlyArray<{ userId: string; date: string; count: number }>,
  days: readonly string[]
): Map<string, ViewHistory> {
  const index = new Map(days.map((d, i) => [d, i]))
  const result = new Map<string, ViewHistory>()
  for (const id of userIds) {
    result.set(id, { daily: new Array(days.length).fill(0), total: 0 })
  }
  for (const row of rows) {
    const history = result.get(row.userId)
    const i = index.get(row.date)
    if (!history || i === undefined) continue
    history.daily[i] += row.count
    history.total += row.count
  }
  return result
}

/** Cards viewed over the last HISTORY_DAYS days for each of the given users. */
export async function getViewHistories(userIds: readonly string[]): Promise<Map<string, ViewHistory>> {
  const days = lastDays()
  if (userIds.length === 0) return new Map()

  const rows = await db
    .select({ userId: dailyViews.userId, date: dailyViews.date, count: dailyViews.count })
    .from(dailyViews)
    .where(and(inArray(dailyViews.userId, [...userIds]), gte(dailyViews.date, days[0])))

  return buildViewHistories(userIds, rows, days)
}
