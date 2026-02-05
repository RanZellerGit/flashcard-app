# Storage Contract: Flashcard Application

**Version**: 1.0
**Last Updated**: 2026-02-03
**Scope**: IndexedDB and localStorage operations for data persistence

## Overview

This contract defines the client-side storage API for the flashcard application. All data operations go through an abstraction layer (`lib/storage.ts`) to isolate IndexedDB/localStorage implementation details.

---

## Storage Layer Interface

### Type Definitions

```typescript
// Deck type
interface Deck {
  id: string;
  name: string;
  createdDate: string; // ISO 8601
  updatedDate: string; // ISO 8601
  cardCount: number;
}

// Flashcard type
interface Flashcard {
  id: string;
  deckId: string;
  frontText: string;
  backText: string;
  order: number;
  createdDate: string; // ISO 8601
}

// Session state type
interface SessionState {
  currentDeckId?: string;
  currentStudySession?: {
    deckId: string;
    cardIndex: number;
    isFlipped: boolean;
  };
}
```

---

## Deck Operations

### `createDeck(name: string): Promise<Deck>`

**Purpose**: Create a new deck with an empty card set

**Input**:
- `name`: string (1-200 chars, required)

**Output**: Promise<Deck>

**Throws**:
- `ValidationError`: if name is empty or exceeds 200 chars
- `QuotaExceededError`: if storage is full

**Side Effects**:
- Generates unique ID
- Sets createdDate = current time
- Sets cardCount = 0
- Stores in IndexedDB

**Example**:
```typescript
const deck = await createDeck("Spanish Vocabulary");
// Returns: {
//   id: "deck-abc123",
//   name: "Spanish Vocabulary",
//   createdDate: "2026-02-03T10:30:00.000Z",
//   updatedDate: "2026-02-03T10:30:00.000Z",
//   cardCount: 0
// }
```

---

### `getAllDecks(): Promise<Deck[]>`

**Purpose**: Retrieve all decks, sorted by newest first

**Input**: None

**Output**: Promise<Deck[]>

**Order**: Descending by createdDate (newest first)

**Throws**:
- `StorageError`: if IndexedDB read fails

**Example**:
```typescript
const decks = await getAllDecks();
// Returns: [
//   { id: "deck-001", name: "Spanish", createdDate: "2026-02-03T...", ... },
//   { id: "deck-002", name: "French", createdDate: "2026-02-02T...", ... }
// ]
```

---

### `getDeck(deckId: string): Promise<Deck | null>`

**Purpose**: Retrieve a single deck by ID

**Input**:
- `deckId`: string (deck identifier)

**Output**: Promise<Deck | null>

**Returns**: null if deck not found

**Throws**:
- `StorageError`: if IndexedDB read fails

---

### `updateDeck(deckId: string, updates: Partial<Deck>): Promise<Deck>`

**Purpose**: Update deck properties (primarily name)

**Input**:
- `deckId`: string
- `updates`: object with properties to update (name only)

**Output**: Promise<Deck>

**Validation**:
- `name`: if provided, must be 1-200 chars

**Immutable Fields** (will be ignored if included):
- id, createdDate, cardCount

**Side Effects**:
- Sets updatedDate = current time
- Persists to IndexedDB

**Throws**:
- `ValidationError`: if provided values invalid
- `NotFoundError`: if deck doesn't exist
- `StorageError`: if write fails

**Example**:
```typescript
const updated = await updateDeck("deck-001", { name: "Advanced Spanish" });
```

---

### `deleteDeck(deckId: string): Promise<void>`

**Purpose**: Delete a deck and all its associated cards

**Input**:
- `deckId`: string

**Side Effects**:
- Deletes all Flashcards with matching deckId (cascade)
- Removes Deck from IndexedDB
- Clears session state if currently editing this deck

**Throws**:
- `NotFoundError`: if deck doesn't exist
- `StorageError`: if write fails

**Example**:
```typescript
await deleteDeck("deck-001");
// All cards in deck-001 automatically deleted
```

---

## Flashcard Operations

### `createCard(deckId: string, frontText: string, backText: string): Promise<Flashcard>`

**Purpose**: Add a new flashcard to a deck

**Input**:
- `deckId`: string (must exist)
- `frontText`: string (1-500 chars, required)
- `backText`: string (1-500 chars, required)

**Output**: Promise<Flashcard>

**Validation**:
- Both texts required and non-empty
- Each text max 500 characters
- deckId must reference existing deck

**Side Effects**:
- Generates unique card ID
- Assigns order = current max order + 1 (0-indexed)
- Sets createdDate = current time
- Increments parent Deck.cardCount
- Updates parent Deck.updatedDate
- Persists card and updated deck to IndexedDB

**Throws**:
- `ValidationError`: if texts invalid or empty
- `NotFoundError`: if deckId doesn't exist
- `StorageError`: if write fails

**Example**:
```typescript
const card = await createCard(
  "deck-001",
  "What is 'hello' in Spanish?",
  "Hola"
);
// Returns: {
//   id: "card-xyz789",
//   deckId: "deck-001",
//   frontText: "What is 'hello' in Spanish?",
//   backText: "Hola",
//   order: 0,
//   createdDate: "2026-02-03T10:31:00.000Z"
// }
```

---

### `getCardsByDeck(deckId: string): Promise<Flashcard[]>`

**Purpose**: Retrieve all cards in a deck, ordered by sequence

**Input**:
- `deckId`: string

**Output**: Promise<Flashcard[]>

**Order**: Ascending by order field (0, 1, 2, ...)

**Returns**: Empty array if deck exists but has no cards

**Throws**:
- `StorageError`: if IndexedDB read fails

**Example**:
```typescript
const cards = await getCardsByDeck("deck-001");
// Returns cards ordered by insertion sequence
```

---

### `updateCard(cardId: string, updates: Partial<Flashcard>): Promise<Flashcard>`

**Purpose**: Update card content (front/back text)

**Input**:
- `cardId`: string
- `updates`: object with properties to update (frontText, backText)

**Output**: Promise<Flashcard>

**Validation**:
- `frontText`: if provided, must be 1-500 chars
- `backText`: if provided, must be 1-500 chars

**Immutable Fields** (will be ignored):
- id, deckId, order, createdDate

**Throws**:
- `ValidationError`: if provided values invalid
- `NotFoundError`: if card doesn't exist
- `StorageError`: if write fails

**Example**:
```typescript
const updated = await updateCard("card-xyz789", {
  backText: "Hola / Buenos días"
});
```

---

### `deleteCard(cardId: string): Promise<void>`

**Purpose**: Remove a card from its deck

**Input**:
- `cardId`: string

**Side Effects**:
- Removes card from IndexedDB
- Decrements parent Deck.cardCount
- Updates parent Deck.updatedDate
- Renumbers remaining cards' order field (closes gaps: 0,1,2 → 0,1 after deletion)
- Persists updated deck to IndexedDB

**Throws**:
- `NotFoundError`: if card doesn't exist
- `StorageError`: if write fails

**Example**:
```typescript
await deleteCard("card-xyz789");
// Remaining cards reordered automatically
```

---

## Session State Operations

### `setSessionState(state: Partial<SessionState>): Promise<void>`

**Purpose**: Save current session state to localStorage

**Input**:
- `state`: object with session properties to set

**Side Effects**:
- Merges with existing session state
- Persists to localStorage under key `flashcard-app-session`

**Throws**:
- `QuotaExceededError`: if localStorage is full

**Example**:
```typescript
await setSessionState({
  currentDeckId: "deck-001",
  currentStudySession: { deckId: "deck-001", cardIndex: 0, isFlipped: false }
});
```

---

### `getSessionState(): Promise<SessionState>`

**Purpose**: Retrieve current session state

**Input**: None

**Output**: Promise<SessionState>

**Returns**: Empty object {} if no session saved

**Throws**:
- `StorageError`: if localStorage read fails

---

### `clearSessionState(): Promise<void>`

**Purpose**: Clear all session state

**Input**: None

**Side Effects**:
- Removes session data from localStorage
- Clears currentDeckId and study session

**Throws**:
- `StorageError`: if localStorage write fails

---

## Error Handling

### Standard Errors

All operations reject with one of these error types:

| Error Type | Cause | HTTP Equivalent |
|-----------|-------|-----------------|
| `ValidationError` | Input validation failed | 400 |
| `NotFoundError` | Resource doesn't exist | 404 |
| `QuotaExceededError` | Storage quota full | 507 |
| `StorageError` | Generic IndexedDB/localStorage failure | 500 |

### Example Error Handling

```typescript
try {
  await createCard(deckId, "", "answer");
} catch (error) {
  if (error instanceof ValidationError) {
    console.log("Front text cannot be empty");
  } else if (error instanceof NotFoundError) {
    console.log("Deck not found");
  } else if (error instanceof QuotaExceededError) {
    console.log("Storage full");
  }
}
```

---

## Initialization & Lifecycle

### `initializeStorage(): Promise<void>`

**Purpose**: Set up IndexedDB and verify schema

**Called**: Once on app start (in root layout)

**Side Effects**:
- Creates IndexedDB database if needed
- Validates existing data integrity
- Repairs denormalized cardCount if mismatched
- Initializes event listeners for storage quota warnings

**Throws**:
- `StorageError`: if initialization fails

---

## Performance Characteristics

| Operation | Time Complexity | Notes |
|-----------|-----------------|-------|
| getAllDecks | O(n) | Indexed scan; typical n=50 |
| getDeck | O(1) | Direct key lookup |
| createDeck | O(1) | Write + schema update |
| updateDeck | O(1) | Key-based update |
| deleteDeck | O(m) | m = cards in deck (cascade) |
| createCard | O(1) | Write + parent update |
| getCardsByDeck | O(m) | m = cards in deck; indexed range query |
| deleteCard | O(m) | m = remaining cards (renumbering) |

---

## Consistency Guarantees

- **Atomicity**: Single deck or card operation is atomic; cascade operations are sequenced (not atomic)
- **Integrity**: Referential integrity validated on card create/deck delete
- **Isolation**: No concurrent transactions in single-threaded browser context
- **Durability**: IndexedDB/localStorage guaranteed persistent until user clears data

## Testing Contract

All storage operations must be tested with:
1. **Happy path**: Valid inputs, expected outputs
2. **Validation**: Invalid inputs rejected with correct error types
3. **Not found**: Missing resources handled gracefully
4. **Quota**: Storage full scenario triggers appropriate error
5. **Cascade**: Deck deletion cascades to cards; card deletion updates parent deck
6. **Idempotency**: Re-running same operation is safe (get operations always safe; delete operations idempotent after first call)
