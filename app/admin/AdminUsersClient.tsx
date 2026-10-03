'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import type { AdminUser, Role } from '@/lib/auth/admin'

interface AdminUsersClientProps {
  currentUserId: string
  initialUsers: AdminUser[]
  initialTotalCount: number
}

const PAGE_SIZE = 50

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function ViewsSparkline({ daily, total }: { daily: number[]; total: number }) {
  const max = Math.max(1, ...daily)
  return (
    <div className="flex items-center gap-3">
      <span className="font-semibold text-gray-900 tabular-nums w-10 text-right">{total}</span>
      <div
        className="flex items-end gap-px h-6"
        aria-hidden="true"
        title={daily.map((c, i) => `${i === daily.length - 1 ? 'today' : `${daily.length - 1 - i}d ago`}: ${c}`).join('\n')}
      >
        {daily.map((c, i) => (
          <div
            key={i}
            className={c > 0 ? 'w-1.5 rounded-sm bg-blue-500' : 'w-1.5 rounded-sm bg-gray-200'}
            style={{ height: `${Math.max(8, (c / max) * 100)}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export function AdminUsersClient({
  currentUserId,
  initialUsers,
  initialTotalCount,
}: AdminUsersClientProps) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const isFirstRender = useRef(true)

  const loadUsers = useCallback(async (q: string, off: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(off) })
      if (q.trim()) params.set('query', q.trim())
      const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load users')
      }
      const data = await res.json()
      setUsers(data.users)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search / pagination (skip on first render: SSR data is present)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const handle = setTimeout(() => loadUsers(query, offset), 300)
    return () => clearTimeout(handle)
  }, [query, offset, loadUsers])

  const changeRole = async (user: AdminUser, role: Role) => {
    setUpdatingId(user.id)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update role')
      }
      setUsers((prev) => prev.map((u) => (u.id === user.id ? data : u)))
      const label = user.email ?? user.name ?? user.id
      setNotice(role === 'admin' ? `${label} is now an admin` : `${label} is no longer an admin`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setUpdatingId(null)
    }
  }

  const page = Math.floor(offset / PAGE_SIZE) + 1
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              ← Back
            </Link>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Admin · Users</h1>
          </div>
          <UserButton />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOffset(0)
            }}
            placeholder="Search by name or email…"
            aria-label="Search users"
            className="w-full sm:max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500">
            {totalCount} user{totalCount !== 1 ? 's' : ''}
            {loading && ' · loading…'}
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="mb-4 px-4 py-3 rounded-lg bg-green-50 text-green-700 text-sm">
            {notice}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Joined</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Last sign-in</th>
                <th className="px-4 py-3 font-medium">Viewed (14d)</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
              {users.map((user) => {
                const isSelf = user.id === currentUserId
                const isAdminRole = user.role === 'admin'
                const busy = updatingId === user.id
                const cannotDemote = isSelf || user.bootstrapAdmin
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={user.imageUrl}
                          alt=""
                          className="w-8 h-8 rounded-full bg-gray-200"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {user.name ?? user.email ?? user.id}
                            {isSelf && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                          </div>
                          {user.name && user.email && (
                            <div className="text-gray-500 truncate">{user.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      {formatDate(user.lastSignInAt)}
                    </td>
                    <td className="px-4 py-3">
                      <ViewsSparkline daily={user.viewHistory.daily} total={user.viewHistory.total} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          isAdminRole
                            ? 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700'
                            : 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600'
                        }
                      >
                        {isAdminRole ? 'Admin' : 'User'}
                      </span>
                      {user.bootstrapAdmin && (
                        <span
                          className="ml-2 text-xs text-gray-400"
                          title="Granted via the ADMIN_EMAILS environment variable"
                        >
                          via env
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isAdminRole ? (
                        <button
                          onClick={() => changeRole(user, 'user')}
                          disabled={busy || cannotDemote}
                          title={
                            isSelf
                              ? 'You cannot remove your own admin role'
                              : user.bootstrapAdmin
                                ? 'Remove this email from ADMIN_EMAILS to demote'
                                : undefined
                          }
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {busy ? 'Saving…' : 'Remove admin'}
                        </button>
                      ) : (
                        <button
                          onClick={() => changeRole(user, 'admin')}
                          disabled={busy}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {busy ? 'Saving…' : 'Make admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <button
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              disabled={offset === 0 || loading}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="text-gray-500">
              Page {page} of {pageCount}
            </span>
            <button
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= totalCount || loading}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
