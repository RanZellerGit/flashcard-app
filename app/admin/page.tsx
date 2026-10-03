import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdmin, listUsers } from '@/lib/auth/admin'
import { AdminUsersClient } from './AdminUsersClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  if (!(await isAdmin(userId))) {
    redirect('/')
  }

  const { users, totalCount } = await listUsers({ limit: 50 })

  return (
    <AdminUsersClient
      currentUserId={userId}
      initialUsers={users}
      initialTotalCount={totalCount}
    />
  )
}
