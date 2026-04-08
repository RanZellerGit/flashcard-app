'use client'

import { useRouter } from 'next/navigation'
import { SwipeMode } from '@/components/SwipeMode'

export function SwipeClient({ userId }: { userId: string }) {
  const router = useRouter()
  return <SwipeMode userId={userId} onExit={() => router.push('/')} />
}
