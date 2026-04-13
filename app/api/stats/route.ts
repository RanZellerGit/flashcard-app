import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { flashcards } from '@/lib/db/schema'
import { eq, gte, and, count } from 'drizzle-orm'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [totalResult] = await db
    .select({ total: count() })
    .from(flashcards)
    .where(eq(flashcards.userId, userId))

  const [masteredResult] = await db
    .select({ mastered: count() })
    .from(flashcards)
    .where(and(eq(flashcards.userId, userId), gte(flashcards.knownCount, 10)))

  return NextResponse.json({
    totalCards: totalResult?.total ?? 0,
    masteredCards: masteredResult?.mastered ?? 0,
  })
}
