/**
 * Pure role-resolution logic (no Clerk imports) so it can be unit tested.
 *
 * A user is an admin when either:
 *  - their Clerk publicMetadata.role is 'admin' (set via the Admin page), or
 *  - their primary email is listed in the ADMIN_EMAILS env var (bootstrap
 *    admins, so the first admin can be created without touching the dashboard).
 */

export type Role = 'admin' | 'user'

export const ROLES: readonly Role[] = ['admin', 'user'] as const

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

/** Minimal shape of a Clerk user needed to resolve a role. */
export interface RoleSource {
  publicMetadata?: Record<string, unknown> | null
  primaryEmailAddressId?: string | null
  emailAddresses?: ReadonlyArray<{ id: string; emailAddress: string }>
}

/** Parse a comma/whitespace-separated list of emails into normalized form. */
export function parseAdminEmails(raw: string | undefined | null): string[] {
  if (!raw) return []
  return raw
    .split(/[,\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
}

export function getPrimaryEmail(user: RoleSource): string | null {
  const addresses = user.emailAddresses ?? []
  const primary =
    addresses.find((e) => e.id === user.primaryEmailAddressId) ?? addresses[0]
  return primary ? primary.emailAddress.toLowerCase() : null
}

export function isBootstrapAdmin(user: RoleSource, adminEmails: readonly string[]): boolean {
  if (adminEmails.length === 0) return false
  const email = getPrimaryEmail(user)
  return email !== null && adminEmails.includes(email)
}

export function getMetadataRole(user: RoleSource): Role {
  const role = user.publicMetadata?.role
  return role === 'admin' ? 'admin' : 'user'
}

/** Resolve the effective role for a user. */
export function resolveRole(user: RoleSource, adminEmails: readonly string[] = []): Role {
  if (getMetadataRole(user) === 'admin') return 'admin'
  if (isBootstrapAdmin(user, adminEmails)) return 'admin'
  return 'user'
}
