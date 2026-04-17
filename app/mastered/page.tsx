import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { MasteredClient } from './MasteredClient'

export default async function MasteredPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  return <MasteredClient userId={userId} />
}
