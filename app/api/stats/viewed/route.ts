import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { dailyViews } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const date = todayString()

  await db
    .insert(dailyViews)
    .values({ userId, date, count: 1 })
    .onConflictDoUpdate({
      target: [dailyViews.userId, dailyViews.date],
      set: { count: sql`${dailyViews.count} + 1` },
    })

  return NextResponse.json({ success: true })
}
