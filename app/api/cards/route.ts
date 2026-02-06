import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { decks, flashcards } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { generateId, validateCardText, sanitizeInput } from '@/lib/utils'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { deckId, frontText, backText } = body

  // Validate deck exists and belongs to user
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .limit(1)

  if (!deck) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  }

  // Validate card text
  if (!frontText || !validateCardText(frontText)) {
    return NextResponse.json(
      { error: 'Front text must be 1-500 characters' },
      { status: 400 }
    )
  }
  if (!backText || !validateCardText(backText)) {
    return NextResponse.json(
      { error: 'Back text must be 1-500 characters' },
      { status: 400 }
    )
  }

  // Get current card count to set order
  const existingCards = await db
    .select()
    .from(flashcards)
    .where(eq(flashcards.deckId, deckId))

  const order = existingCards.length

  const now = new Date()
  const newCard = {
    id: generateId(),
    deckId,
    frontText: sanitizeInput(frontText),
    backText: sanitizeInput(backText),
    cardOrder: order,
    createdDate: now,
    userId,
  }

  await db.insert(flashcards).values(newCard)

  // Update deck card count
  await db
    .update(decks)
    .set({ cardCount: deck.cardCount + 1, updatedDate: now })
    .where(eq(decks.id, deckId))

  return NextResponse.json({
    id: newCard.id,
    deckId: newCard.deckId,
    frontText: newCard.frontText,
    backText: newCard.backText,
    order: newCard.cardOrder,
    createdDate: newCard.createdDate.toISOString(),
    userId: newCard.userId,
  })
}
