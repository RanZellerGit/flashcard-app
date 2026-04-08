import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { decks, flashcards } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { validateCardText, sanitizeInput } from '@/lib/utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { frontText, backText, isKnown } = body

  // Verify ownership
  const [existing] = await db
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.id, id), eq(flashcards.userId, userId)))
    .limit(1)

  if (!existing) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 })
  }

  // Validate card text
  if (frontText !== undefined && !validateCardText(frontText)) {
    return NextResponse.json(
      { error: 'Front text must be 1-500 characters' },
      { status: 400 }
    )
  }
  if (backText !== undefined && !validateCardText(backText)) {
    return NextResponse.json(
      { error: 'Back text must be 1-500 characters' },
      { status: 400 }
    )
  }

  const updates: { frontText?: string; backText?: string; isKnown?: boolean } = {}
  if (frontText !== undefined) {
    updates.frontText = sanitizeInput(frontText)
  }
  if (backText !== undefined) {
    updates.backText = sanitizeInput(backText)
  }
  if (isKnown !== undefined) {
    updates.isKnown = Boolean(isKnown)
  }

  if (Object.keys(updates).length > 0) {
    await db
      .update(flashcards)
      .set(updates)
      .where(and(eq(flashcards.id, id), eq(flashcards.userId, userId)))
  }

  const [updated] = await db
    .select()
    .from(flashcards)
    .where(eq(flashcards.id, id))
    .limit(1)

  return NextResponse.json({
    id: updated.id,
    deckId: updated.deckId,
    frontText: updated.frontText,
    backText: updated.backText,
    order: updated.cardOrder,
    isKnown: updated.isKnown,
    createdDate: updated.createdDate.toISOString(),
    userId: updated.userId,
  })
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership
  const [existing] = await db
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.id, id), eq(flashcards.userId, userId)))
    .limit(1)

  if (!existing) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 })
  }

  // Delete the card
  await db
    .delete(flashcards)
    .where(and(eq(flashcards.id, id), eq(flashcards.userId, userId)))

  // Update deck card count
  const [deck] = await db
    .select()
    .from(decks)
    .where(eq(decks.id, existing.deckId))
    .limit(1)

  if (deck) {
    await db
      .update(decks)
      .set({ cardCount: Math.max(0, deck.cardCount - 1), updatedDate: new Date() })
      .where(eq(decks.id, existing.deckId))
  }

  return NextResponse.json({ success: true })
}
