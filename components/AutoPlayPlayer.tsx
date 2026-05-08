'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface CardEntry {
  cardId: string
  frontText: string
  backText: string
  deckId: string
  deckName: string
}

interface WordRange {
  start: number
  length: number
}

interface AutoPlayPlayerProps {
  onClose: () => void
}

function wordLengthAt(text: string, start: number): number {
  const match = text.slice(start).match(/^\S+/)
  return match ? match[0].length : 1
}

function HighlightedText({
  text,
  range,
  dim,
  large,
}: {
  text: string
  range: WordRange | null
  dim?: boolean
  large?: boolean
}) {
  const base = dim ? 'text-gray-400' : 'text-gray-800'
  if (!range) {
    return <span className={base}>{text}</span>
  }
  const before = text.slice(0, range.start)
  const word = text.slice(range.start, range.start + range.length)
  const after = text.slice(range.start + range.length)
  return (
    <span className={base}>
      {before}
      <mark
        className={`bg-yellow-300 text-gray-900 rounded not-italic font-semibold ${
          large ? 'px-1 py-0.5' : 'px-0.5'
        }`}
      >
        {word}
      </mark>
      {after}
    </span>
  )
}

export function AutoPlayPlayer({ onClose }: AutoPlayPlayerProps) {
  const [cards, setCards] = useState<CardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [phase, setPhase] = useState<'front' | 'back' | 'idle'>('idle')
  const [wordRange, setWordRange] = useState<WordRange | null>(null)

  const cancelRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const indexRef = useRef(0)

  useEffect(() => {
    fetch('/api/cards/all')
      .then((r) => r.json())
      .then((data: CardEntry[]) => {
        for (let i = data.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[data[i], data[j]] = [data[j], data[i]]
        }
        setCards(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const stopSpeech = () => {
    clearTimer()
    window.speechSynthesis.cancel()
    setWordRange(null)
  }

  const playFrom = useCallback(
    (index: number) => {
      if (cancelRef.current || index >= cards.length) {
        setIsPlaying(false)
        setIsPaused(false)
        setPhase('idle')
        setWordRange(null)
        return
      }

      indexRef.current = index
      setCurrentIndex(index)
      setIsPlaying(true)
      setIsPaused(false)
      setWordRange(null)

      const card = cards[index]

      const speakFront = new SpeechSynthesisUtterance(card.frontText)
      speakFront.rate = 0.9
      setPhase('front')

      speakFront.onboundary = (e) => {
        if (e.name !== 'word') return
        setWordRange({ start: e.charIndex, length: e.charLength ?? wordLengthAt(card.frontText, e.charIndex) })
      }

      speakFront.onend = () => {
        setWordRange(null)
        if (cancelRef.current) return
        timeoutRef.current = setTimeout(() => {
          if (cancelRef.current) return
          const speakBack = new SpeechSynthesisUtterance(card.backText)
          speakBack.rate = 0.9
          setPhase('back')

          speakBack.onboundary = (e) => {
            if (e.name !== 'word') return
            setWordRange({ start: e.charIndex, length: e.charLength ?? wordLengthAt(card.backText, e.charIndex) })
          }

          speakBack.onend = () => {
            setWordRange(null)
            if (cancelRef.current) return
            setPhase('idle')
            timeoutRef.current = setTimeout(() => {
              playFrom(index + 1)
            }, 1500)
          }

          window.speechSynthesis.speak(speakBack)
        }, 700)
      }

      window.speechSynthesis.speak(speakFront)
    },
    [cards]
  )

  const handlePlay = () => {
    cancelRef.current = false
    playFrom(currentIndex)
  }

  const handlePause = () => {
    cancelRef.current = true
    stopSpeech()
    setIsPlaying(false)
    setIsPaused(true)
    setPhase('idle')
  }

  const handleStop = () => {
    cancelRef.current = true
    stopSpeech()
    setIsPlaying(false)
    setIsPaused(false)
    setPhase('idle')
    setCurrentIndex(0)
    indexRef.current = 0
  }

  const handleSkipNext = () => {
    cancelRef.current = true
    stopSpeech()
    const next = indexRef.current + 1
    cancelRef.current = false
    playFrom(next)
  }

  const handleSkipPrev = () => {
    cancelRef.current = true
    stopSpeech()
    const prev = Math.max(0, indexRef.current - 1)
    cancelRef.current = false
    playFrom(prev)
  }

  const handleClose = () => {
    cancelRef.current = true
    stopSpeech()
    onClose()
  }

  useEffect(() => {
    return () => {
      cancelRef.current = true
      clearTimer()
      window.speechSynthesis.cancel()
    }
  }, [])

  const current = cards[currentIndex]
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-3 max-h-[60vh] overflow-y-auto">
        {loading ? (
          <p className="text-sm text-gray-500 text-center">Loading cards...</p>
        ) : cards.length === 0 ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">No cards found.</p>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <CloseIcon />
            </button>
          </div>
        ) : (
          <div>
            {/* Meta row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{currentIndex + 1} / {cards.length}</span>
                {current && <span className="text-xs text-blue-500">{current.deckName}</span>}
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1" title="Close">
                <CloseIcon />
              </button>
            </div>

            {/* Karaoke text display */}
            {current && (
              <div className="bg-gray-50 rounded-lg px-4 py-3 mb-3 space-y-2 max-h-36 overflow-y-auto">
                <div className="text-sm sm:text-base font-semibold leading-relaxed">
                  <HighlightedText
                    text={current.frontText}
                    range={phase === 'front' ? wordRange : null}
                    dim={phase === 'back'}
                    large
                  />
                </div>
                <div className="text-sm sm:text-base leading-relaxed border-t border-gray-200 pt-2">
                  <HighlightedText
                    text={current.backText}
                    range={phase === 'back' ? wordRange : null}
                    dim={phase === 'front'}
                    large
                  />
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <ControlButton onClick={handleSkipPrev} disabled={currentIndex === 0 || loading} title="Previous">
                <PrevIcon />
              </ControlButton>

              {isPlaying ? (
                <ControlButton onClick={handlePause} primary title="Pause">
                  <PauseIcon />
                </ControlButton>
              ) : (
                <ControlButton onClick={handlePlay} primary title={isPaused ? 'Resume' : 'Play'}>
                  <PlayIcon />
                </ControlButton>
              )}

              <ControlButton
                onClick={handleSkipNext}
                disabled={currentIndex >= cards.length - 1 || loading}
                title="Next"
              >
                <NextIcon />
              </ControlButton>

              <ControlButton onClick={handleStop} title="Stop" disabled={!isPlaying && !isPaused}>
                <StopIcon />
              </ControlButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ControlButton({
  onClick,
  disabled,
  primary,
  title,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  primary?: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed ${
        primary
          ? 'bg-blue-600 text-white hover:bg-blue-700 w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center'
          : 'text-gray-600 hover:bg-gray-100 p-2 min-w-[40px] min-h-[40px]'
      }`}
    >
      {children}
    </button>
  )
}

function PlayIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 6h12v12H6z" />
    </svg>
  )
}

function PrevIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
    </svg>
  )
}

function NextIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 3.9V8.1L8.5 12zM16 6h2v12h-2z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
