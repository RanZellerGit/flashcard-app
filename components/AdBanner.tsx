'use client'

import { useEffect, useRef } from 'react'

interface AdBannerProps {
  adSlot: string
  adFormat?: string
  fullWidthResponsive?: boolean
  className?: string
}

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export function AdBanner({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch (err) {
      console.error('AdSense error:', err)
    }
  }, [])

  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID
  const isDev = process.env.NODE_ENV === 'development'

  if (!publisherId) return null

  if (isDev) {
    return (
      <div className={`ad-container ${className}`}>
        <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 py-4 text-sm text-gray-400">
          Ad Space — {adSlot}
        </div>
      </div>
    )
  }

  return (
    <div className={`ad-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={publisherId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  )
}
