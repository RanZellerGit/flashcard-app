import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { dailyViews } from '@/lib/db/schema'
import { eq, gte, and } from 'drizzle-orm'

const DAYS = 14

function dateString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Build the last DAYS dates (UTC), oldest first
  const today = new Date()
  const days: string[] = []
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    days.push(dateString(d))
  }

  const cutoff = days[0]
  const rows = await db
    .select({ date: dailyViews.date, count: dailyViews.count })
    .from(dailyViews)
    .where(and(eq(dailyViews.userId, userId), gte(dailyViews.date, cutoff)))

  const countByDate = new Map(rows.map((r) => [r.date, r.count]))
  const history = days.map((date) => ({ date, count: countByDate.get(date) ?? 0 }))

  const response = NextResponse.json({ history })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
