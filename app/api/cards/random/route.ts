import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { flashcards } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cards = await db
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.userId, userId), eq(flashcards.isKnown, false)))
    .orderBy(sql`RANDOM()`)
    .limit(20)

  const response = NextResponse.json(
    cards.map((card) => ({
      id: card.id,
      deckId: card.deckId,
      frontText: card.frontText,
      backText: card.backText,
      order: card.cardOrder,
      isKnown: card.isKnown,
      createdDate: card.createdDate.toISOString(),
      userId: card.userId,
    }))
  )

  response.headers.set('Cache-Control', 'no-store')
  return response
}
