# Quickstart Guide: Flashcard Learning Application

**Date**: 2026-02-03
**Feature**: Flashcard Learning Application
**Branch**: `001-flashcard-app`

## Development Environment Setup

### Prerequisites

- **Node.js**: 18.17.0 or higher
- **npm**: 9.0.0 or higher
- **Git**: For version control

### Project Initialization

```bash
# Clone the repository (or navigate to existing)
cd /path/to/project

# Install dependencies
npm install

# Start development server
npm run dev
# App runs at http://localhost:3000
```

---

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout, storage init
│   ├── page.tsx                # Dashboard (all decks)
│   ├── deck/
│   │   └── [id]/
│   │       ├── page.tsx        # Deck detail (manage cards)
│   │       └── study/
│   │           └── page.tsx    # Study mode
│   └── api/                    # Future API routes (unused in MVP)
│
├── components/
│   ├── Dashboard.tsx           # Dashboard container
│   ├── DeckCard.tsx            # Individual deck display
│   ├── DeckForm.tsx            # Create/edit deck form
│   ├── CardForm.tsx            # Add/edit card form
│   ├── StudyCard.tsx           # Flashcard display
│   ├── StudyMode.tsx           # Study session
│   └── ui/                     # Shadcn UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       ├── textarea.tsx
│       └── [other shadcn components]
│
├── lib/
│   ├── storage.ts              # IndexedDB/localStorage API
│   ├── types.ts                # TypeScript interfaces
│   └── utils.ts                # Helper functions
│
├── tests/
│   ├── unit/
│   │   ├── storage.test.ts
│   │   └── utils.test.ts
│   ├── integration/
│   │   └── components.test.tsx
│   └── e2e/
│       └── user-flow.spec.ts
│
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── .env.local                  # Environment variables (git-ignored)
```

---

## Key Technologies

### Framework & Runtime
- **Next.js 14+**: React framework with App Router
- **React 18+**: UI library
- **TypeScript 5.x**: Type-safe development

### UI & Styling
- **Shadcn UI**: Pre-built, accessible React components
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Primitives underlying Shadcn

### Forms & Validation
- **React Hook Form**: Form state management
- **Zod**: TypeScript-first schema validation

### Storage
- **IndexedDB**: Primary data storage (decks, cards)
- **localStorage**: Session state storage

### Testing
- **Vitest**: Unit test runner
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end testing
- **Jest**: Additional test framework (for some test types)

---

## Core Modules

### `lib/storage.ts` - Storage Abstraction Layer

Provides promise-based API for all data operations. Isolates IndexedDB/localStorage implementation.

**Key Functions**:
```typescript
// Deck operations
createDeck(name: string): Promise<Deck>
getAllDecks(): Promise<Deck[]>
getDeck(deckId: string): Promise<Deck | null>
updateDeck(deckId: string, updates: Partial<Deck>): Promise<Deck>
deleteDeck(deckId: string): Promise<void>

// Card operations
createCard(deckId, frontText, backText): Promise<Flashcard>
getCardsByDeck(deckId: string): Promise<Flashcard[]>
updateCard(cardId, updates): Promise<Flashcard>
deleteCard(cardId: string): Promise<void>

// Session state
setSessionState(state: Partial<SessionState>): Promise<void>
getSessionState(): Promise<SessionState>
clearSessionState(): Promise<void>
```

**Data Types**:
```typescript
interface Deck {
  id: string;
  name: string;
  createdDate: string;
  updatedDate: string;
  cardCount: number;
}

interface Flashcard {
  id: string;
  deckId: string;
  frontText: string;
  backText: string;
  order: number;
  createdDate: string;
}
```

---

## Development Workflow

### 1. Creating a New Feature

1. Create component file in `components/`
2. Define TypeScript interface for props
3. Implement component with Shadcn elements
4. Add unit tests in `tests/unit/`
5. Add integration tests if component uses storage

### 2. Adding a Page

1. Create file in `app/` (follows Next.js routing)
2. Example: `app/deck/[id]/edit/page.tsx` → `/deck/:id/edit` route
3. Use `params` prop to access route parameters
4. Wrap page content with layout components

### 3. Storage Operations

All storage calls go through `lib/storage.ts`:

```typescript
// In a component
import { createCard, getCardsByDeck } from '@/lib/storage';

const handleAddCard = async (frontText: string, backText: string) => {
  try {
    const newCard = await createCard(deckId, frontText, backText);
    // Update local state or refetch cards
  } catch (error) {
    // Handle ValidationError, NotFoundError, etc.
  }
};
```

### 4. Styling Components

Use Tailwind CSS classes + Shadcn components:

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function MyComponent() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h2 className="text-2xl font-bold">Title</h2>
      </CardHeader>
      <CardContent>
        <Button className="w-full">Click me</Button>
      </CardContent>
    </Card>
  );
}
```

---

## Running Tests

### Unit Tests
```bash
npm run test
# Watch mode
npm run test:watch
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
# With UI
npx playwright test --ui
```

### All Tests
```bash
npm run test:all
```

---

## Building & Deployment

### Development Build
```bash
npm run dev
# Hot reload enabled; runs at http://localhost:3000
```

### Production Build
```bash
npm run build
npm run start
# Optimized build; runs at http://localhost:3000
```

### Static Export (Recommended for MVP)
```bash
# Configure next.config.js: output: 'export'
npm run build
# Creates 'out/' directory with static files
# Can be deployed to any static hosting (Vercel, Netlify, GitHub Pages, etc.)
```

---

## Environment Variables

Create `.env.local` file (not git-tracked):

```env
# Optional: API endpoints (future use)
# NEXT_PUBLIC_API_URL=https://api.example.com

# Optional: Analytics/debugging
NEXT_PUBLIC_DEBUG=false
```

**Note**: Prefix with `NEXT_PUBLIC_` to expose to browser; otherwise only available server-side.

---

## Debugging

### Browser DevTools
1. Open Chrome/Firefox DevTools (F12)
2. **IndexedDB**: Application tab → IndexedDB → flashcard-app
3. **localStorage**: Application tab → Local Storage
4. **React**: Install React DevTools extension
5. **Network**: Check (should be minimal in MVP - no API calls)

### Console Logging
```typescript
// In storage.ts
console.log('[Storage] Creating deck:', name);

// In components
console.log('[Dashboard] Loaded decks:', decks);
```

### Error Handling
```typescript
try {
  const result = await someStorageOperation();
} catch (error) {
  console.error('[Error]', error.message);
  // Display user-friendly error message
  setError('Failed to save. Please try again.');
}
```

---

## Key Implementation Patterns

### Page Component Pattern

```typescript
// app/deck/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getDeck, getCardsByDeck } from '@/lib/storage';
import { Deck, Flashcard } from '@/lib/types';

export default function DeckDetailPage({ params }: { params: { id: string } }) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDeck = async () => {
      setLoading(true);
      const deckData = await getDeck(params.id);
      const cardsData = await getCardsByDeck(params.id);
      setDeck(deckData);
      setCards(cardsData);
      setLoading(false);
    };

    loadDeck();
  }, [params.id]);

  if (loading) return <div>Loading...</div>;
  if (!deck) return <div>Deck not found</div>;

  return (
    <div>
      <h1>{deck.name}</h1>
      {/* Render cards, forms, etc. */}
    </div>
  );
}
```

### Form Component Pattern

```typescript
// components/DeckForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';

interface DeckFormProps {
  initialDeck?: Deck;
  onSubmit: (deck: Partial<Deck>) => Promise<void>;
  onCancel: () => void;
}

export function DeckForm({ initialDeck, onSubmit, onCancel }: DeckFormProps) {
  const [name, setName] = useState(initialDeck?.name || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Deck name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ name });
      onCancel();
    } catch (err) {
      setError('Failed to save deck');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Deck name"
        maxLength={200}
      />
      {error && <p className="text-red-500">{error}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
      <Button type="button" onClick={onCancel} variant="outline">
        Cancel
      </Button>
    </form>
  );
}
```

---

## Common Tasks

### Adding Shadcn Components

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
```

Components are copied into `components/ui/` (not node_modules).

### Running a Single Test File

```bash
npm run test -- storage.test.ts
```

### Inspecting IndexedDB in Code

```typescript
const db = await new Promise((resolve, reject) => {
  const request = indexedDB.open('flashcard-app');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const allDecks = await new Promise((resolve) => {
  const transaction = db.transaction('decks', 'readonly');
  const store = transaction.objectStore('decks');
  const request = store.getAll();
  request.onsuccess = () => resolve(request.result);
});

console.log(allDecks);
```

---

## Performance & Optimization

### Lazy Loading Pages
Next.js automatically code-splits by route. Study mode only loaded when visiting `/deck/[id]/study`.

### Caching Cards During Study
Study session loads cards once and keeps in state. No re-fetch on flip.

```typescript
// Load cards once
const [cards, setCards] = useState<Flashcard[]>([]);

useEffect(() => {
  const loadCards = async () => {
    const data = await getCardsByDeck(deckId);
    setCards(data);
  };
  loadCards();
}, [deckId]); // Only refetch if deckId changes

// Use cached cards
const currentCard = cards[currentCardIndex];
```

### Batching Storage Writes
If adding multiple cards in succession, batch updates to minimize IndexedDB transactions.

---

## Troubleshooting

### "Cannot find module" errors
- Run `npm install`
- Ensure import paths use `@/` alias (configured in tsconfig.json)

### IndexedDB quota exceeded
- Clear browser storage (DevTools → Application → Clear site data)
- Test quota handling in tests

### Components not re-rendering after storage change
- Ensure state updates trigger re-render
- Use `setCards([...newCards])` (new array reference) not `setCards(newCards)` (same reference)

### TypeScript errors on localStorage
- Use `JSON.stringify()` / `JSON.parse()` for serialization
- Type session state as `SessionState`

---

## References

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Shadcn UI](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [IndexedDB Guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

