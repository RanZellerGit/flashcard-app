'use client'

import { useEffect, useState } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/lib/context/SessionContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { initializeStorage } from '@/lib/storage'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        await initializeStorage()
        setIsReady(true)
      } catch (error) {
        console.error('Storage initialization error:', error)
        setIsReady(true) // Still show app even if storage init fails
      }
    }

    init()
  }, [])

  return (
    <html lang="en">
      <head>
        <title>Flashcard App</title>
        <meta name="description" content="Learn with interactive flashcards" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        {isReady ? (
          <ErrorBoundary>
            <SessionProvider>
              {children}
            </SessionProvider>
          </ErrorBoundary>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Loading...</p>
          </div>
        )}
      </body>
    </html>
  )
}
