import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { decks, flashcards } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await db
    .select({
      cardId: flashcards.id,
      frontText: flashcards.frontText,
      backText: flashcards.backText,
      cardOrder: flashcards.cardOrder,
      deckId: decks.id,
      deckName: decks.name,
    })
    .from(flashcards)
    .innerJoin(decks, eq(flashcards.deckId, decks.id))
    .where(eq(flashcards.userId, userId))
    .orderBy(decks.name, flashcards.cardOrder)

  return NextResponse.json(results)
}
