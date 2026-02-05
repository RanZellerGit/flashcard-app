'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { SessionState } from '../types'
import { getSessionState, setSessionState as setStorageSessionState } from '../storage'

interface SessionContextType {
  session: SessionState
  setStudySession: (
    session:
      | { deckId: string; cardIndex: number; isFlipped: boolean }
      | undefined
  ) => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>({})

  // Initialize session state from localStorage
  useEffect(() => {
    const savedSession = getSessionState()
    setSession(savedSession)
  }, [])

  const setStudySession = useCallback(async (
    studySession:
      | { deckId: string; cardIndex: number; isFlipped: boolean }
      | undefined
  ) => {
    setSession(prev => {
      const updated = { ...prev, currentStudySession: studySession }
      setStorageSessionState(updated)
      return updated
    })
  }, [])

  const value: SessionContextType = { session, setStudySession }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return context
}
