# Data Model: Flashcard Learning Application

**Date**: 2026-02-03
**Feature**: Flashcard Learning Application
**Branch**: `001-flashcard-app`

## Entity Definitions

### Deck

**Purpose**: Container for a set of related flashcards organized by topic

**Attributes**:

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-----------|-------|
| id | string (UUID) | Yes | Primary key, unique | Generated on creation |
| name | string | Yes | 1-200 characters | Deck title; user-provided |
| createdDate | ISO 8601 string | Yes | Not modifiable | Set on creation; millisecond precision |
| updatedDate | ISO 8601 string | Yes | Auto-updated | Updated when cards are added/removed |
| cardCount | number | Yes | Computed (0+) | Denormalized count for performance; recalculated on card operations |

**Example**:
```json
{
  "id": "deck-001",
  "name": "Spanish Vocabulary",
  "createdDate": "2026-02-03T10:30:00.000Z",
  "updatedDate": "2026-02-03T10:35:00.000Z",
  "cardCount": 15
}
```

**Validation Rules**:
- `name`: Required, non-empty, max 200 characters, trimmed
- `id`: Auto-generated if not provided; must be unique
- `cardCount`: Must match actual count of associated cards

**Relationships**:
- One Deck has many Flashcards (1:N)
- Cards referenced via `Flashcard.deckId` field

---

### Flashcard

**Purpose**: Individual learning unit with front (question) and back (answer) text

**Attributes**:

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-----------|-------|
| id | string (UUID) | Yes | Primary key, unique | Generated on creation |
| deckId | string | Yes | Foreign key → Deck.id | Identifies parent deck |
| frontText | string | Yes | 1-500 characters | Question/prompt side |
| backText | string | Yes | 1-500 characters | Answer/response side |
| order | number | Yes | 0+ integer, unique per deck | Maintains card sequence within deck |
| createdDate | ISO 8601 string | Yes | Not modifiable | Set on creation |

**Example**:
```json
{
  "id": "card-001",
  "deckId": "deck-001",
  "frontText": "What is the Spanish word for 'hello'?",
  "backText": "Hola",
  "order": 0,
  "createdDate": "2026-02-03T10:31:00.000Z"
}
```

**Validation Rules**:
- `frontText`: Required, non-empty, max 500 characters, trimmed
- `backText`: Required, non-empty, max 500 characters, trimmed
- `deckId`: Must reference an existing Deck (referential integrity check)
- `order`: Auto-assigned based on insertion; no gaps (0, 1, 2, ...)

**Relationships**:
- Many Flashcards belong to one Deck (N:1)
- Parent deck identified via `deckId` field

---

## Storage Schema

### IndexedDB Structure

**Database Name**: `flashcard-app`
**Version**: 1

**Object Stores**:

#### Store: `decks`
```
keyPath: "id"
indexes:
  - createdDate: ascending (for sorting)
```

#### Store: `cards`
```
keyPath: "id"
indexes:
  - deckId: ascending (for querying cards by deck)
  - deckId + order: compound index (for ordered card retrieval)
```

**Initialization Code**:
```typescript
const request = indexedDB.open('flashcard-app', 1);

request.onupgradeneeded = (event) => {
  const db = event.target.result;

  // Create decks store
  if (!db.objectStoreNames.contains('decks')) {
    const decksStore = db.createObjectStore('decks', { keyPath: 'id' });
    decksStore.createIndex('createdDate', 'createdDate', { unique: false });
  }

  // Create cards store
  if (!db.objectStoreNames.contains('cards')) {
    const cardsStore = db.createObjectStore('cards', { keyPath: 'id' });
    cardsStore.createIndex('deckId', 'deckId', { unique: false });
  }
};
```

### localStorage Structure (Session State)

**Key**: `flashcard-app-session`
**Value**: JSON-serialized session state

```json
{
  "currentDeckId": "deck-001",
  "currentStudySession": {
    "deckId": "deck-001",
    "cardIndex": 3,
    "isFlipped": false
  }
}
```

---

## CRUD Operations

### Deck Operations

#### Create Deck
- **Input**: name (string)
- **Output**: Deck object with generated id
- **Side Effects**: cardCount = 0, createdDate = now
- **Validation**: name non-empty, <200 chars
- **Error Cases**: Duplicate name (allowed per spec); storage quota exceeded

#### Read Decks
- **Input**: None (for all) or deckId (for single)
- **Output**: Deck[] or Deck
- **Query**: `decks.getAll()` or `decks.get(id)`
- **Sorting**: By createdDate descending (newest first) on dashboard

#### Update Deck
- **Input**: deckId, fields to update (name)
- **Output**: Updated Deck
- **Side Effects**: updatedDate = now
- **Validation**: Name validation same as create
- **Constraint**: Cannot update id, createdDate

#### Delete Deck
- **Input**: deckId
- **Side Effects**: Cascade delete all cards with this deckId
- **Validation**: Deck must exist
- **Order**: Delete cards first, then deck

### Flashcard Operations

#### Create Card
- **Input**: deckId, frontText, backText
- **Output**: Flashcard object with generated id
- **Side Effects**:
  - order = current max order in deck + 1
  - createdDate = now
  - Increment parent deck's cardCount
  - Update parent deck's updatedDate
- **Validation**: Both texts non-empty, <500 chars; deckId exists
- **Error Cases**: Deck not found, storage quota exceeded

#### Read Cards
- **Input**: deckId
- **Output**: Flashcard[] ordered by order field
- **Query**: `cards.index('deckId').getAll(deckId)` sorted by order
- **Sorting**: Ascending by order (preserves creation sequence)

#### Update Card
- **Input**: cardId, fields to update (frontText, backText)
- **Output**: Updated Flashcard
- **Validation**: Same text validation as create
- **Constraint**: Cannot update id, deckId, order, createdDate

#### Delete Card
- **Input**: cardId
- **Side Effects**:
  - Decrement parent deck's cardCount
  - Update parent deck's updatedDate
  - Renumber remaining cards' order field (close gaps)
- **Validation**: Card must exist; parent deck must exist

---

## Data Integrity Rules

### Referential Integrity
- **Rule**: Every Flashcard.deckId must reference an existing Deck
- **Enforcement**: Validation on create; cascade delete on deck removal
- **Check Trigger**: Card creation, deck deletion

### Uniqueness Constraints
- **Deck ID**: Globally unique
- **Card ID**: Globally unique
- **Card Order**: Unique within each deck (0 to cardCount-1)

### Denormalization Strategy
- **Field**: Deck.cardCount (denormalized copy of COUNT(cards.deckId))
- **Rationale**: Fast dashboard display; avoids expensive count query
- **Maintenance**: Recalculated on every card add/delete/cascade-delete
- **Risk Mitigation**: Validation function to verify and repair count during app initialization

### Cascade Operations
- **Deck Deletion**: Automatically delete all associated cards
- **Card Insertion**: Update parent deck's cardCount and updatedDate
- **Card Deletion**: Update parent deck's cardCount, updatedDate, and renumber order

---

## State Transitions

### Deck Lifecycle
```
Created → Has Cards (0+) → Deleted (cascade cards)
```

### Card Lifecycle (within Deck)
```
Created → (Last card: triggers end-of-deck) → Deleted (renumber siblings)
```

### Study Session State
```
Not Started → In Progress → Completed → Reset (return to deck view)
```

---

## Performance Considerations

### Query Patterns
- **Most common**: "Get all decks" (dashboard load) - O(n) indexed scan
- **Frequent**: "Get cards for deck in order" (study load) - O(m) indexed range query where m = cardCount
- **Less frequent**: "Search cards by text" - O(n) linear scan (no text index)

### Optimization Opportunities
- Cache deck list in component state (invalidate on add/delete/update)
- Cache card list during study session (no re-fetch on flip)
- Batch card insertions (multiple addCard calls in sequence)
- Debounce storage writes for session state

### Scalability Limits
- **Per browser**: ~50MB storage limit (typical); ~1000 decks × 100 cards each = ~5MB (well within limit)
- **Per deck**: No hard limit; practical limit ~500 cards before UI performance degrades
- **Card size**: ~500 chars × 2 × 500 cards = ~500KB per deck (negligible)

---

## Migration & Evolution

### Version 1 (Current)
- Two object stores: decks, cards
- No versioning in schema
- Future versions would increment database version and implement onupgradeneeded logic

### Future Enhancements (Out of Scope)
- Add `tags` store for categorization
- Add `progress` store for tracking study metrics
- Add `export` format (JSON) for backup
- Add sync queue for cloud backup
