import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { decks } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { generateId, validateDeckName, sanitizeInput } from '@/lib/utils'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await db
    .select()
    .from(decks)
    .where(eq(decks.userId, userId))
    .orderBy(desc(decks.createdDate))

  const deckList = result.map((row) => ({
    id: row.id,
    name: row.name,
    createdDate: row.createdDate.toISOString(),
    updatedDate: row.updatedDate.toISOString(),
    cardCount: row.cardCount,
    userId: row.userId,
  }))

  return NextResponse.json(deckList)
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name } = body

  if (!name || !validateDeckName(name)) {
    return NextResponse.json(
      { error: 'Deck name must be 1-200 characters' },
      { status: 400 }
    )
  }

  const now = new Date()
  const newDeck = {
    id: generateId(),
    name: sanitizeInput(name),
    createdDate: now,
    updatedDate: now,
    cardCount: 0,
    userId,
  }

  await db.insert(decks).values(newDeck)

  return NextResponse.json({
    id: newDeck.id,
    name: newDeck.name,
    createdDate: newDeck.createdDate.toISOString(),
    updatedDate: newDeck.updatedDate.toISOString(),
    cardCount: newDeck.cardCount,
    userId: newDeck.userId,
  })
}
