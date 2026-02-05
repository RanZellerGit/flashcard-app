# Research & Analysis: Flashcard Learning Application

**Date**: 2026-02-03
**Feature**: Flashcard Learning Application
**Branch**: `001-flashcard-app`

## Overview

Research findings for implementing a flashcard application with Next.js and Shadcn UI, focusing on storage patterns, component architecture, and performance optimization.

---

## 1. Browser Data Persistence Strategy

### Decision: IndexedDB with localStorage fallback

**Rationale**:
- IndexedDB provides sufficient storage (typically 50MB+) for typical flashcard use cases
- Synchronous localStorage API suitable for card data synchronization
- Both APIs available in all modern browsers
- Enables offline functionality per spec requirements

**Implementation Pattern**:
- Use IndexedDB for main data store (decks and cards)
- Use localStorage for app state (current deck, study session progress)
- Implement abstraction layer to switch between storage backends

**Alternatives Considered**:
- **Web Storage (localStorage only)**: Limited to 5-10MB; would restrict deck size. Rejected.
- **Dexie.js/IndexedDB wrapper**: Adds unnecessary dependency complexity. Direct IndexedDB API is adequate for simple schema.
- **SQLite WASM (sql.js)**: Over-engineered for MVP; adds complexity without proportional benefit.

**Specifications Compliance**: ✓ Meets "persist all decks and cards" requirement (FR-009)

---

## 2. Next.js App Router Architecture

### Decision: Use Next.js 14+ App Router with layout hierarchy

**Rationale**:
- App Router (not Pages Router) is the recommended approach for new Next.js projects
- Natural file-system based routing aligns with feature structure
- Built-in layouts enable shared UI (header, navigation) across routes
- Server Components reduce bundle size; Client Components used only where needed (forms, interactive UI)

**Proposed Route Structure**:
```
/                           # Dashboard (deck list)
/deck/[id]                  # Deck detail/management
/deck/[id]/study            # Study mode (interactive)
```

**Alternatives Considered**:
- **Pages Router**: Legacy; App Router is the recommended current standard.
- **Remix**: Heavier framework; Next.js is sufficient for this scope.

---

## 3. Component Library & Styling

### Decision: Shadcn UI with Tailwind CSS

**Rationale**:
- Shadcn provides pre-built, accessible components (buttons, forms, dialogs, cards)
- Copy-paste model allows customization without npm dependency bloat
- Tailwind CSS integrates seamlessly; provides utility-first styling
- Active community; well-documented

**Component Selection for MVP**:
- **Card**: Display deck summaries and study cards
- **Button**: Navigation, form submission
- **Input**: Text fields for deck/card creation
- **Form**: React Hook Form integration for validation
- **Dialog**: Modal forms for creating/editing decks and cards
- **Badge**: Display card count on deck cards

**Alternatives Considered**:
- **Material-UI**: Heavier bundle; over-featured for MVP.
- **Chakra UI**: Good alternative; Shadcn chosen for lighter weight and closer Tailwind integration.
- **Headless UI + Tailwind only**: Possible but requires more custom component building.

---

## 4. Form Handling & Validation

### Decision: React Hook Form + Zod for validation

**Rationale**:
- React Hook Form has minimal performance overhead; zero dependencies
- Zod provides TypeScript-first schema validation
- Integrates well with Shadcn form components
- Lightweight and focused on the task (form state management + validation)

**Validation Rules** (from spec):
- Deck name: required, non-empty string
- Card front text: required, non-empty string
- Card back text: required, non-empty string
- Maximum lengths: Not specified in spec; suggest 500 chars per field for UX

**Alternatives Considered**:
- **Formik**: Heavier; more features than needed for simple forms.
- **Manual validation**: Error-prone and verbose.

---

## 5. State Management for Study Session

### Decision: React Context API for session state

**Rationale**:
- Study session is contained within a single route (`/deck/[id]/study`)
- Limited state scope: current card index, flip state
- Context API sufficient; no need for Redux/Zustand
- Reduces bundle size and complexity

**State Shape**:
```typescript
{
  deckId: string;
  currentCardIndex: number;
  isFlipped: boolean;
  cards: Flashcard[];
}
```

**Alternatives Considered**:
- **Redux**: Overkill for single-page session state.
- **Zustand**: Lightweight but unnecessary for this scope.
- **Component Props**: Would require prop drilling through 3+ levels; Context is cleaner.

---

## 6. Data Model & Relationships

### Decision: Flat storage with foreign key references

**Rationale**:
- IndexedDB supports object stores; each entity type gets its own store
- Maintain referential integrity through deckId field on Flashcard
- Simple queries: all decks, all cards in deck

**Entities**:
- **Deck**: { id, name, createdDate }
- **Flashcard**: { id, deckId, frontText, backText, order }

**Alternatives Considered**:
- **Nested structure** (cards array within deck): Updates to cards would require entire deck serialization. Rejected.
- **Relational normalization**: IndexedDB isn't relational; flat structure with FKs is the standard pattern.

---

## 7. Testing Strategy

### Decision: Vitest (unit) + React Testing Library (components) + Playwright (E2E)

**Rationale**:
- Vitest: Fast, ES modules native, excellent TypeScript support
- RTL: Encourages testing user behavior (not implementation details)
- Playwright: Reliable browser automation; tests real user flows

**Coverage Goals**:
- Unit: Storage layer (CRUD operations), utilities
- Integration: Component rendering with mocked data
- E2E: Full user journeys (create deck → add cards → study)

**Alternatives Considered**:
- **Jest + Puppeteer**: Heavier; Vitest + Playwright is modern stack.
- **Cypress**: Good alternative; Playwright chosen for speed and reliability.

---

## 8. Performance Considerations

### Decision: Code splitting, lazy loading, data caching

**Rationale**:
- Study mode page (`/deck/[id]/study`) code-split from dashboard
- Card data cached in state during study session (no re-fetch on flip)
- Meets success criterion: "respond to user actions within 500ms" (SC-005)

**Optimization Checklist**:
- [ ] Lazy load study mode component
- [ ] Cache card list in session state
- [ ] Debounce storage writes (batch updates)
- [ ] Measure Core Web Vitals (LCP, FID, CLS)

**Alternatives Considered**:
- **Server-side rendering (SSR)**: Not needed for offline-first app; static export more appropriate.
- **Service Worker caching**: Workbox integration; optional enhancement post-MVP.

---

## 9. Offline-First Architecture

### Decision: Client-side only; no network calls required for MVP

**Rationale**:
- Spec requires offline capability ("Data is stored locally on the device")
- IndexedDB provides persistence without backend
- Simplifies deployment (static Next.js export possible)
- No external dependencies or API contracts needed

**Future Enhancement Path**:
- When cloud sync is needed: Add optional backend with sync queue
- Maintain local-first pattern: offline changes queue in IndexedDB, sync when online

---

## 10. Accessibility & Keyboard Navigation

### Decision: Semantic HTML + ARIA labels via Shadcn; keyboard navigation support

**Rationale**:
- Shadcn components include accessibility features
- Study mode must support keyboard navigation (arrow keys for card navigation)
- Meets user expectation for common interaction patterns

**Keyboard Bindings** (to implement):
- **Space** or **Click**: Flip card
- **Right Arrow** or **Next button**: Next card
- **Left Arrow** or **Previous button**: Previous card
- **Escape**: Exit study mode

**Testing**: Manual accessibility testing with screen reader; keyboard-only navigation verification

---

## Summary of Technical Decisions

| Component | Decision | Justification |
|-----------|----------|---------------|
| Storage | IndexedDB + localStorage | Offline, sufficient capacity, native browser |
| Framework | Next.js 14+ App Router | Modern, performant, file-based routing |
| UI Library | Shadcn + Tailwind | Lightweight, customizable, accessible |
| Forms | React Hook Form + Zod | Minimal overhead, TypeScript-first validation |
| State | React Context (session), localStorage (persistent) | Proportionate to scope, simple to reason about |
| Data Model | Flat with FK references | IndexedDB native pattern, simple queries |
| Testing | Vitest + RTL + Playwright | Modern, performant test stack |
| Deployment | Static export (Next.js) | No backend needed, easy hosting |

All decisions align with MVP scope and success criteria. No architecture contradictions identified.
