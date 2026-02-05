'use client'

import { useState } from 'react'

interface MobileNavProps {
  title: string
  onBack?: () => void
  showBackButton?: boolean
}

/**
 * T048: Mobile-responsive navigation header
 */
export function MobileNav({
  title,
  onBack,
  showBackButton = true,
}: MobileNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Go back"
              >
                ←
              </button>
            )}
            <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
          </div>
        </div>
      </div>

      {/* Desktop Header - Hidden on Mobile */}
      <div className="hidden md:block">
        <div className="mb-8">
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4"
              aria-label="Go back"
            >
              ← Back
            </button>
          )}
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        </div>
      </div>
    </>
  )
}
