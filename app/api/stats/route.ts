import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { flashcards, dailyViews } from '@/lib/db/schema'
import { eq, gte, and, count } from 'drizzle-orm'

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [totalResult, masteredResult, viewedTodayResult] = await Promise.all([
    db.select({ total: count() }).from(flashcards).where(eq(flashcards.userId, userId)),
    db.select({ mastered: count() }).from(flashcards).where(and(eq(flashcards.userId, userId), gte(flashcards.knownCount, 10))),
    db.select({ viewedCount: dailyViews.count }).from(dailyViews).where(and(eq(dailyViews.userId, userId), eq(dailyViews.date, todayString()))),
  ])

  const response = NextResponse.json({
    totalCards: totalResult[0]?.total ?? 0,
    masteredCards: masteredResult[0]?.mastered ?? 0,
    viewedToday: viewedTodayResult[0]?.viewedCount ?? 0,
  })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
