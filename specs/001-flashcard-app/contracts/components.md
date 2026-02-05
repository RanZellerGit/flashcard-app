# Component Contract: Flashcard Application

**Version**: 1.0
**Last Updated**: 2026-02-03
**Scope**: React component interfaces and responsibilities

---

## Component Hierarchy

```
RootLayout (app/layout.tsx)
├── DashboardPage (app/page.tsx)
│   ├── DashboardHeader
│   ├── DashboardEmptyState (when no decks)
│   └── DeckGrid
│       └── DeckCard[] (each deck)
│           ├── DeckName
│           ├── CardCount
│           └── ActionButtons (Study, Edit, Delete)
│
├── DeckDetailPage (app/deck/[id]/page.tsx)
│   ├── DeckHeader
│   ├── DeckCardsList
│   │   └── CardItem[] (each card)
│   │       ├── FrontText
│   │       └── ActionButtons (Edit, Delete)
│   └── AddCardButton
│       └── CardForm (dialog)
│
└── StudyPage (app/deck/[id]/study/page.tsx)
    ├── StudyHeader (deck name, progress)
    └── StudyCard
        ├── CardDisplay (front/back flip)
        └── NavigationControls (Previous, Next, Exit)
```

---

## Page Components

### DashboardPage (`app/page.tsx`)

**Responsibility**: Display all user decks; entry point to app

**Props**: None (root page)

**State** (local):
- `decks`: Deck[] - list of all decks
- `loading`: boolean - initial load state
- `isCreatingDeck`: boolean - show create form

**Effects**:
- Load all decks on mount
- Refetch on deck create/delete

**Renders**:
- Empty state if no decks
- Grid of DeckCard components if decks exist
- Create Deck button/form

**Interactions**:
- Click DeckCard → Navigate to /deck/[id]
- Click Create Deck → Show DeckForm dialog

**Success Criteria** (from spec):
- FR-003: Display all decks with name and card count
- SC-001: Users can create deck in under 3 minutes (form simple and fast)

---

### DeckDetailPage (`app/deck/[id]/page.tsx`)

**Responsibility**: Manage a single deck; add/edit/delete cards

**Props** (from route):
- `params.id`: string - deck ID

**State** (local):
- `deck`: Deck - current deck
- `cards`: Flashcard[] - cards in deck
- `loading`: boolean
- `isAddingCard`: boolean - show add card form
- `editingCardId?: string` - card being edited

**Effects**:
- Load deck and cards on mount
- Refetch on card create/delete/update

**Renders**:
- Deck name header
- Card list with edit/delete buttons
- Add Card button/form
- Study button (navigates to study page)
- Back button (return to dashboard)

**Interactions**:
- Click Study → Navigate to /deck/[id]/study
- Click Add Card → Show CardForm dialog
- Click Edit Card → Show CardForm dialog with card data
- Click Delete Card → Confirm + delete
- Click Back → Return to dashboard

**Success Criteria**:
- FR-001: Create deck and add cards
- FR-002: Add text-based cards to deck
- SC-001: Users can add 5 cards in under 3 minutes

---

### StudyPage (`app/deck/[id]/study/page.tsx`)

**Responsibility**: Study mode; flip through cards with navigation

**Props** (from route):
- `params.id`: string - deck ID

**State** (local):
- `deck`: Deck
- `cards`: Flashcard[] - loaded at start
- `currentCardIndex`: number - 0-based index
- `isFlipped`: boolean - card flip state

**Effects**:
- Load deck and cards on mount
- Save session state to localStorage on card index/flip change

**Renders**:
- Deck name + progress (e.g., "Card 3 of 10")
- StudyCard (center)
- Navigation buttons (Previous, Next)
- Exit button

**Keyboard Handlers**:
- Space / Enter: Flip card
- ArrowLeft / Left click: Previous card
- ArrowRight / Right click: Next card
- Escape: Exit to deck view

**Interactions**:
- Click/Space card → Toggle flip
- Click Previous → Decrement index (no-op on card 0)
- Click Next → Increment index (show completion message on last card)
- Click Exit → Return to deck view

**Success Criteria**:
- FR-004: Enter study mode
- FR-005: Display card with front text first
- FR-006: Flip to show back text
- FR-007: Navigate to next card
- FR-008: Navigate to previous card
- FR-011: Show message at end of deck
- SC-002: Navigate deck with ≤2 clicks per card
- SC-005: Respond to actions within 500ms

---

## Form Components

### DeckForm (dialog/modal)

**Responsibility**: Create or edit a deck

**Props**:
- `initialDeck?: Deck` - for edit mode; omit for create
- `onSubmit: (deck: Partial<Deck>) => Promise<void>` - save callback
- `onCancel: () => void` - close dialog

**State** (local):
- `name: string` - form input
- `error?: string` - validation error
- `isSubmitting: boolean` - submission state

**Validation**:
- `name`: Required, 1-200 chars, non-empty after trim

**Renders**:
- Text input for deck name
- Submit button (Create / Save)
- Cancel button
- Error message if validation fails

**Success Criteria**:
- FR-001: Create deck with name
- FR-010: Validate non-empty fields

---

### CardForm (dialog/modal)

**Responsibility**: Create or edit a flashcard

**Props**:
- `deckId: string` - parent deck
- `initialCard?: Flashcard` - for edit mode; omit for create
- `onSubmit: (card: Partial<Flashcard>) => Promise<void>` - save callback
- `onCancel: () => void` - close dialog

**State** (local):
- `frontText: string` - form input
- `backText: string` - form input
- `error?: string` - validation error
- `isSubmitting: boolean` - submission state

**Validation**:
- `frontText`: Required, 1-500 chars
- `backText`: Required, 1-500 chars

**Renders**:
- Textarea for front (question)
- Textarea for back (answer)
- Submit button (Add / Save)
- Cancel button
- Character count indicators
- Error message if validation fails

**Success Criteria**:
- FR-002: Add card with front/back text
- FR-010: Validate non-empty fields

---

## Display Components

### DeckCard

**Responsibility**: Display individual deck in grid/list

**Props**:
- `deck: Deck` - deck to display
- `onStudy: (deckId: string) => void` - study button handler
- `onEdit: (deckId: string) => void` - optional edit handler
- `onDelete: (deckId: string) => void` - optional delete handler

**Renders**:
- Deck name (heading)
- Card count (e.g., "15 cards")
- Study button
- Delete button (with confirmation)
- Optional Edit button

**Interactions**:
- Click Study → Call onStudy(deckId) → Navigate to study
- Click Delete → Show confirmation → Call onDelete(deckId)

**Styling**:
- Shadcn Card component
- Grid layout (responsive: 1-3 columns)
- Hover state with subtle shadow/lift

---

### StudyCard

**Responsibility**: Display single flashcard with flip animation

**Props**:
- `card: Flashcard` - card to display
- `isFlipped: boolean` - show front or back
- `onFlip: () => void` - toggle flip handler
- `cardIndex: number` - current card number
- `cardCount: number` - total cards in deck

**Renders**:
- Progress indicator (e.g., "3 of 10")
- Large card display (front or back text)
- Clickable area with flip handler
- Optional "Click to flip" hint

**Styling**:
- Shadcn Card component, large
- Centered on screen
- 3D flip animation (CSS transform)
- Distinct text color/style for front vs. back
- Hover state indicates clickable

**Success Criteria**:
- FR-005: Display front text initially
- FR-006: Toggle to show back text
- SC-005: Respond to flip within 500ms

---

### DeckCardsList

**Responsibility**: Display all cards in a deck as list

**Props**:
- `cards: Flashcard[]` - list of cards
- `onEditCard: (card: Flashcard) => void` - edit handler
- `onDeleteCard: (cardId: string) => void` - delete handler
- `loading: boolean` - show loading state

**Renders**:
- List of card items (each showing front text)
- Edit button per card
- Delete button per card
- Empty state if no cards
- Loading spinner if loading

**Styling**:
- Shadcn Table or List component
- Ordered display (by card order field)
- Truncate long text with ellipsis

---

## Navigation Components

### DashboardHeader

**Responsibility**: Top navigation for dashboard

**Props**:
- `onCreateDeck: () => void` - trigger deck creation

**Renders**:
- App title/logo
- "Create New Deck" button

---

### StudyHeader

**Responsibility**: Top navigation for study mode

**Props**:
- `deckName: string`
- `cardIndex: number` - current card (0-based)
- `cardCount: number` - total cards
- `onExit: () => void` - exit handler

**Renders**:
- Deck name
- Progress counter (e.g., "3 of 10")
- Exit button (back to deck)

---

## Layout Component

### RootLayout (`app/layout.tsx`)

**Responsibility**: App shell; initialize storage; provide context

**Effects**:
- Initialize storage on mount
- Set up error boundary
- Set up providers (React Context for session state)

**Renders**:
- Metadata (title, meta tags)
- Root HTML structure
- Child routes

---

## Type Contracts

### Component Props Interface

All components use TypeScript for props:

```typescript
// Page components (no props from parent)
interface DashboardPageProps {}
interface DeckDetailPageProps {
  params: { id: string };
}
interface StudyPageProps {
  params: { id: string };
}

// Form components
interface DeckFormProps {
  initialDeck?: Deck;
  onSubmit: (deck: Partial<Deck>) => Promise<void>;
  onCancel: () => void;
}

interface CardFormProps {
  deckId: string;
  initialCard?: Flashcard;
  onSubmit: (card: Partial<Flashcard>) => Promise<void>;
  onCancel: () => void;
}

// Display components
interface DeckCardProps {
  deck: Deck;
  onStudy: (deckId: string) => void;
  onEdit?: (deckId: string) => void;
  onDelete?: (deckId: string) => void;
}

interface StudyCardProps {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
  cardIndex: number;
  cardCount: number;
}

interface DeckCardsListProps {
  cards: Flashcard[];
  onEditCard: (card: Flashcard) => void;
  onDeleteCard: (cardId: string) => void;
  loading?: boolean;
}
```

---

## State Management Pattern

**Session State Context** (React Context):

```typescript
interface SessionContextType {
  currentDeckId?: string;
  setCurrentDeckId: (id?: string) => void;
  studySession?: {
    deckId: string;
    cardIndex: number;
    isFlipped: boolean;
  };
  setStudySession: (session?: StudySession) => void;
}
```

- Persists to localStorage
- Restored on app start
- Used to preserve user position if they refresh

---

## Accessibility Requirements

All components must:
- Use semantic HTML (`<button>`, `<form>`, `<nav>`, etc.)
- Support keyboard navigation (Tab, Space, Enter, Arrow keys)
- Include ARIA labels for screen readers
- Have sufficient color contrast (WCAG AA minimum)
- Provide focus indicators for keyboard users

---

## Testing Strategy

### Unit Tests (Jest + RTL)
- Component rendering with various props
- Event handlers (click, form submission)
- Conditional rendering (loading, empty state)
- Error states and validation messages

### Integration Tests (RTL)
- Form submission flow
- Navigation between pages
- State persistence (session restore)
- Storage interaction (mocked)

### E2E Tests (Playwright)
- User journeys (create deck → add card → study → navigate)
- Keyboard navigation verification
- Persistence across page refresh
- Error handling (quota exceeded, etc.)
