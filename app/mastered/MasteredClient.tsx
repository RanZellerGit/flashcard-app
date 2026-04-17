'use client'

import { useRouter } from 'next/navigation'
import { MasteredMode } from '@/components/MasteredMode'

export function MasteredClient({ userId }: { userId: string }) {
  const router = useRouter()
  return <MasteredMode userId={userId} onExit={() => router.push('/')} />
}
