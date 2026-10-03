import { NextResponse } from 'next/server'
import { requireAdmin, setUserRole, getUserRole } from '@/lib/auth/admin'
import { isRole } from '@/lib/auth/roles'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const check = await requireAdmin()
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const role = (body as { role?: unknown } | null)?.role
  if (!isRole(role)) {
    return NextResponse.json({ error: "role must be 'admin' or 'user'" }, { status: 400 })
  }

  // Prevent admins from locking themselves out.
  if (id === check.userId && role !== 'admin') {
    return NextResponse.json(
      { error: 'You cannot remove your own admin role' },
      { status: 400 }
    )
  }

  try {
    const user = await setUserRole(id, role)

    // A bootstrap admin (ADMIN_EMAILS) stays admin regardless of metadata.
    if (role === 'user' && user.bootstrapAdmin) {
      return NextResponse.json(
        {
          error: 'This user is an admin via the ADMIN_EMAILS environment variable and cannot be demoted here',
          user,
        },
        { status: 409 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    const status = (error as { status?: number })?.status
    if (status === 404) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    console.error('Failed to update user role:', error)
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  const check = await requireAdmin()
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }
  const { id } = await params
  try {
    const role = await getUserRole(id)
    return NextResponse.json({ id, role })
  } catch (error) {
    const status = (error as { status?: number })?.status
    if (status === 404) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    console.error('Failed to fetch user role:', error)
    return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 })
  }
}
