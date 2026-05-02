import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { decks, flashcards, dailyViews } from '@/lib/db/schema'
import { eq, desc, and, gte, count } from 'drizzle-orm'
import { HomeClient } from './HomeClient'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export default async function Home() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const [deckRows, totalResult, masteredResult, viewedResult] = await Promise.all([
    db.select().from(decks).where(eq(decks.userId, userId)).orderBy(desc(decks.createdDate)),
    db.select({ total: count() }).from(flashcards).where(eq(flashcards.userId, userId)),
    db.select({ mastered: count() }).from(flashcards).where(and(eq(flashcards.userId, userId), gte(flashcards.knownCount, 10))),
    db.select({ viewedCount: dailyViews.count }).from(dailyViews).where(and(eq(dailyViews.userId, userId), eq(dailyViews.date, todayString()))),
  ])

  const initialDecks = deckRows.map((row) => ({
    id: row.id,
    name: row.name,
    createdDate: row.createdDate.toISOString(),
    updatedDate: row.updatedDate.toISOString(),
    cardCount: row.cardCount,
    userId: row.userId,
  }))

  const initialStats = {
    totalCards: totalResult[0]?.total ?? 0,
    masteredCards: masteredResult[0]?.mastered ?? 0,
    viewedToday: viewedResult[0]?.viewedCount ?? 0,
  }

  return <HomeClient userId={userId} initialDecks={initialDecks} initialStats={initialStats} />
}
