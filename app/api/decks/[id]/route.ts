import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { decks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { validateDeckName, sanitizeInput } from '@/lib/utils'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteParams) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, id), eq(decks.userId, userId)))
    .limit(1)

  if (!deck) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: deck.id,
    name: deck.name,
    createdDate: deck.createdDate.toISOString(),
    updatedDate: deck.updatedDate.toISOString(),
    cardCount: deck.cardCount,
    userId: deck.userId,
  })
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { name } = body

  // Verify ownership
  const [existing] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, id), eq(decks.userId, userId)))
    .limit(1)

  if (!existing) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  }

  if (name !== undefined && !validateDeckName(name)) {
    return NextResponse.json(
      { error: 'Deck name must be 1-200 characters' },
      { status: 400 }
    )
  }

  const now = new Date()
  const updates: { name?: string; updatedDate: Date } = { updatedDate: now }
  if (name !== undefined) {
    updates.name = sanitizeInput(name)
  }

  await db
    .update(decks)
    .set(updates)
    .where(and(eq(decks.id, id), eq(decks.userId, userId)))

  const [updated] = await db
    .select()
    .from(decks)
    .where(eq(decks.id, id))
    .limit(1)

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    createdDate: updated.createdDate.toISOString(),
    updatedDate: updated.updatedDate.toISOString(),
    cardCount: updated.cardCount,
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
    .from(decks)
    .where(and(eq(decks.id, id), eq(decks.userId, userId)))
    .limit(1)

  if (!existing) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  }

  // Delete deck (cards will be deleted via CASCADE)
  await db
    .delete(decks)
    .where(and(eq(decks.id, id), eq(decks.userId, userId)))

  return NextResponse.json({ success: true })
}
