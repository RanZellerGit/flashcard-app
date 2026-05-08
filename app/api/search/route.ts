import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { decks, flashcards } from '@/lib/db/schema'
import { eq, and, or, ilike } from 'drizzle-orm'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 1) {
    return NextResponse.json([])
  }

  const pattern = `%${q}%`

  const results = await db
    .select({
      cardId: flashcards.id,
      frontText: flashcards.frontText,
      backText: flashcards.backText,
      deckId: decks.id,
      deckName: decks.name,
    })
    .from(flashcards)
    .innerJoin(decks, eq(flashcards.deckId, decks.id))
    .where(
      and(
        eq(flashcards.userId, userId),
        or(ilike(flashcards.frontText, pattern), ilike(flashcards.backText, pattern))
      )
    )
    .limit(10)

  return NextResponse.json(results)
}
