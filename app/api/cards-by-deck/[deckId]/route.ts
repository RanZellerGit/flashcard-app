import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { decks, flashcards } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'

type RouteParams = { params: Promise<{ deckId: string }> }

export async function GET(request: Request, { params }: RouteParams) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { deckId } = await params

  // Verify deck exists and belongs to user
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .limit(1)

  if (!deck) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  }

  const cards = await db
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.deckId, deckId), eq(flashcards.userId, userId)))
    .orderBy(asc(flashcards.cardOrder))

  const cardList = cards.map((row) => ({
    id: row.id,
    deckId: row.deckId,
    frontText: row.frontText,
    backText: row.backText,
    order: row.cardOrder,
    createdDate: row.createdDate.toISOString(),
    userId: row.userId,
  }))

  return NextResponse.json(cardList, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
