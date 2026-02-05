'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Deck, Flashcard } from '@/lib/types'
import { getDeck, getCardsByDeck } from '@/lib/storage'
import { StudyMode } from '@/components/StudyMode'

/**
 * T039: StudyPage for study mode - flip through flashcards
 */
export default function StudyPage() {
  const router = useRouter()
  const params = useParams()
  const deckId = params.id as string

  const [deck, setDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)

  // Load deck and cards
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const deckData = await getDeck(deckId)
        if (!deckData) {
          router.push('/')
          return
        }
        setDeck(deckData)

        const cardsData = await getCardsByDeck(deckId)
        setCards(cardsData)
      } catch (error) {
        console.error('Failed to load deck:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [deckId])

  const handleExit = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading study mode...</p>
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Deck not found</p>
      </div>
    )
  }

  return (
    <StudyMode
      deckId={deckId}
      deckName={deck.name}
      cards={cards}
      onExit={handleExit}
    />
  )
}
