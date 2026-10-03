import { describe, it, expect } from 'vitest'
import {
  parseAdminEmails,
  getPrimaryEmail,
  isBootstrapAdmin,
  getMetadataRole,
  resolveRole,
  isRole,
} from '@/lib/auth/roles'

const user = (overrides: Partial<Parameters<typeof resolveRole>[0]> = {}) => ({
  publicMetadata: {},
  primaryEmailAddressId: 'e1',
  emailAddresses: [
    { id: 'e2', emailAddress: 'secondary@example.com' },
    { id: 'e1', emailAddress: 'Primary@Example.com' },
  ],
  ...overrides,
})

describe('parseAdminEmails', () => {
  it('returns empty list for missing value', () => {
    expect(parseAdminEmails(undefined)).toEqual([])
    expect(parseAdminEmails('')).toEqual([])
  })

  it('splits on commas and whitespace and lowercases', () => {
    expect(parseAdminEmails(' A@x.com, b@y.com\nC@z.com ')).toEqual([
      'a@x.com',
      'b@y.com',
      'c@z.com',
    ])
  })
})

describe('getPrimaryEmail', () => {
  it('prefers the primary email address, lowercased', () => {
    expect(getPrimaryEmail(user())).toBe('primary@example.com')
  })

  it('falls back to the first address when no primary id matches', () => {
    expect(getPrimaryEmail(user({ primaryEmailAddressId: null }))).toBe('secondary@example.com')
  })

  it('returns null when there are no addresses', () => {
    expect(getPrimaryEmail(user({ emailAddresses: [] }))).toBeNull()
  })
})

describe('isBootstrapAdmin', () => {
  it('matches the primary email case-insensitively', () => {
    expect(isBootstrapAdmin(user(), ['primary@example.com'])).toBe(true)
  })

  it('does not match a secondary email', () => {
    expect(isBootstrapAdmin(user(), ['secondary@example.com'])).toBe(false)
  })

  it('is false when the list is empty', () => {
    expect(isBootstrapAdmin(user(), [])).toBe(false)
  })
})

describe('getMetadataRole', () => {
  it("reads 'admin' from publicMetadata", () => {
    expect(getMetadataRole(user({ publicMetadata: { role: 'admin' } }))).toBe('admin')
  })

  it("defaults to 'user' for anything else", () => {
    expect(getMetadataRole(user())).toBe('user')
    expect(getMetadataRole(user({ publicMetadata: { role: 'superuser' } }))).toBe('user')
    expect(getMetadataRole(user({ publicMetadata: null }))).toBe('user')
  })
})

describe('resolveRole', () => {
  it('is admin via metadata', () => {
    expect(resolveRole(user({ publicMetadata: { role: 'admin' } }))).toBe('admin')
  })

  it('is admin via bootstrap email', () => {
    expect(resolveRole(user(), ['primary@example.com'])).toBe('admin')
  })

  it('is user otherwise', () => {
    expect(resolveRole(user(), ['someone-else@example.com'])).toBe('user')
  })
})

describe('isRole', () => {
  it('accepts only known roles', () => {
    expect(isRole('admin')).toBe(true)
    expect(isRole('user')).toBe(true)
    expect(isRole('root')).toBe(false)
    expect(isRole(undefined)).toBe(false)
  })
})
