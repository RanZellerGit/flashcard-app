'use client'

import { useEffect, useState } from 'react'

interface DayStat {
  date: string
  count: number
}

function formatLabel(date: string): string {
  // date is 'YYYY-MM-DD'
  const [, m, d] = date.split('-')
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`
}

/**
 * Bar chart of cards viewed per day over the last 14 days.
 * Data comes from GET /api/stats/history (backed by the daily_views table).
 */
export function DailyViewsChart({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const [history, setHistory] = useState<DayStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/stats/history', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { history: [] }))
      .then((data) => {
        if (!cancelled) setHistory(data.history ?? [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refreshTrigger])

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-500">Loading activity...</p>
      </div>
    )
  }

  const maxCount = Math.max(1, ...history.map((d) => d.count))
  const total = history.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Cards viewed (last 14 days)</h3>
        <span className="text-xs text-gray-500">{total} total</span>
      </div>
      <div className="flex items-end gap-1 sm:gap-1.5 h-32">
        {history.map((d) => {
          const heightPct = (d.count / maxCount) * 100
          return (
            <div
              key={d.date}
              className="flex-1 h-full flex flex-col items-center justify-end gap-1 group"
            >
              <span className="text-[10px] leading-none text-gray-600 opacity-0 group-hover:opacity-100 transition">
                {d.count}
              </span>
              <div
                className="w-full shrink-0 rounded-t bg-blue-500 hover:bg-blue-600 transition-all min-h-[2px]"
                style={{ height: `${heightPct}%` }}
                title={`${d.date}: ${d.count} card${d.count !== 1 ? 's' : ''}`}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1 sm:gap-1.5 mt-1">
        {history.map((d) => (
          <span
            key={d.date}
            className="flex-1 text-center text-[9px] sm:text-[10px] leading-none text-gray-400"
          >
            {formatLabel(d.date)}
          </span>
        ))}
      </div>
    </div>
  )
}
