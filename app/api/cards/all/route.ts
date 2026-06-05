import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { decks, flashcards } from '@/lib/db/schema'
import { eq, and, lt } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // When `unmastered=1`, exclude cards already mastered (known >= 10 times).
  const unmasteredOnly = request.nextUrl.searchParams.get('unmastered') === '1'

  const conditions = [eq(flashcards.userId, userId)]
  if (unmasteredOnly) {
    conditions.push(lt(flashcards.knownCount, 10))
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
    .where(and(...conditions))
    .orderBy(decks.name, flashcards.cardOrder)

  return NextResponse.json(results)
}
