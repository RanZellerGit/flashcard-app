import { NextResponse } from 'next/server'
import { listUsers, requireAdmin } from '@/lib/auth/admin'

const MAX_LIMIT = 100

export async function GET(request: Request) {
  const check = await requireAdmin()
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') ?? undefined
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get('limit')) || 50))
  const offset = Math.max(0, Number(searchParams.get('offset')) || 0)

  try {
    const result = await listUsers({ query, limit, offset })
    return NextResponse.json(
      { ...result, currentUserId: check.userId },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    )
  } catch (error) {
    console.error('Failed to list users:', error)
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 })
  }
}
