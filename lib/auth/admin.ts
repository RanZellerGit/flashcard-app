/**
 * Server-side admin helpers backed by Clerk.
 *
 * The admin role is stored in Clerk `publicMetadata.role`, with an optional
 * bootstrap list in the ADMIN_EMAILS env var (see lib/auth/roles.ts).
 */
import { auth, clerkClient } from '@clerk/nextjs/server'
import type { User } from '@clerk/nextjs/server'
import { getViewHistories, type ViewHistory } from '@/lib/stats/viewHistory'
import {
  type Role,
  getPrimaryEmail,
  isBootstrapAdmin,
  parseAdminEmails,
  resolveRole,
} from './roles'

export type { Role } from './roles'

export interface AdminUser {
  id: string
  email: string | null
  name: string | null
  imageUrl: string
  role: Role
  /** True when the role comes from ADMIN_EMAILS and cannot be removed from the UI. */
  bootstrapAdmin: boolean
  createdAt: string
  lastSignInAt: string | null
  /** Cards viewed over the last 14 days (see lib/stats/viewHistory.ts). */
  viewHistory: ViewHistory
}

function adminEmails(): string[] {
  return parseAdminEmails(process.env.ADMIN_EMAILS)
}

export function toAdminUser(user: User, viewHistory?: ViewHistory): AdminUser {
  const emails = adminEmails()
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return {
    id: user.id,
    email: getPrimaryEmail(user),
    name: name.length > 0 ? name : null,
    imageUrl: user.imageUrl,
    role: resolveRole(user, emails),
    bootstrapAdmin: isBootstrapAdmin(user, emails),
    createdAt: new Date(user.createdAt).toISOString(),
    lastSignInAt: user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : null,
    viewHistory: viewHistory ?? { daily: [], total: 0 },
  }
}

/** Resolve the effective role of a Clerk user by id. */
export async function getUserRole(userId: string): Promise<Role> {
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  return resolveRole(user, adminEmails())
}

/** Whether the given user (default: the current session user) is an admin. */
export async function isAdmin(userId?: string | null): Promise<boolean> {
  const id = userId ?? (await auth()).userId
  if (!id) return false
  try {
    return (await getUserRole(id)) === 'admin'
  } catch (error) {
    console.error('Failed to resolve admin role:', error)
    return false
  }
}

export type AdminCheck =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; error: string }

/** Guard for API routes and server pages. */
export async function requireAdmin(): Promise<AdminCheck> {
  const { userId } = await auth()
  if (!userId) return { ok: false, status: 401, error: 'Unauthorized' }
  if (!(await isAdmin(userId))) return { ok: false, status: 403, error: 'Forbidden' }
  return { ok: true, userId }
}

export interface ListUsersOptions {
  query?: string
  limit?: number
  offset?: number
}

export async function listUsers({ query, limit = 50, offset = 0 }: ListUsersOptions = {}) {
  const client = await clerkClient()
  const { data, totalCount } = await client.users.getUserList({
    query: query && query.trim().length > 0 ? query.trim() : undefined,
    limit,
    offset,
    orderBy: '-created_at',
  })
  const histories = await getViewHistories(data.map((u) => u.id))
  return { users: data.map((u) => toAdminUser(u, histories.get(u.id))), totalCount }
}

export async function setUserRole(userId: string, role: Role): Promise<AdminUser> {
  const client = await clerkClient()
  const existing = await client.users.getUser(userId)
  const updated = await client.users.updateUserMetadata(userId, {
    publicMetadata: { ...existing.publicMetadata, role },
  })
  const histories = await getViewHistories([userId])
  return toAdminUser(updated, histories.get(userId))
}
