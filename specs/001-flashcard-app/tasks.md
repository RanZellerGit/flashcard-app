# Task List: Flashcard Learning Application

**Feature**: Flashcard Learning Application
**Branch**: `001-flashcard-app`
**Date**: 2026-02-03
**Total Tasks**: 42 (organized by priority and dependency)

---

## Implementation Strategy

**MVP Scope**: User Stories 1-3 (P1 priorities) - Create decks, view dashboard, study mode
**Enhancement**: User Story 4 (P2) - Navigation between sessions
**Parallel Execution**: Multiple components can be developed independently once storage layer is complete

**Recommended Implementation Order**:
1. Phase 1: Project setup and core infrastructure
2. Phase 2: Storage layer (blocking dependency for all stories)
3. Phase 3: User Story 1 (deck/card creation)
4. Phase 4: User Story 2 (dashboard display) - can start parallel with Phase 3
5. Phase 5: User Story 3 (study mode) - can start parallel with Phase 3-4
6. Phase 6: User Story 4 (navigation) - builds on Phase 5
7. Phase 7: Polish and cross-cutting concerns

---

## Phase 1: Project Setup & Infrastructure

### Goal
Initialize Next.js project with required dependencies and project structure.

### Independent Test Criteria
- `npm run dev` starts successfully on `http://localhost:3000`
- Project structure matches plan.md layout
- TypeScript compiles without errors
- All dependencies installed and versions match plan.md

---

- [ ] T001 Initialize Next.js 14+ project with TypeScript in repository root
- [ ] T002 Install core dependencies: React 18+, TypeScript 5.x, Tailwind CSS
- [ ] T003 Install UI dependencies: Shadcn UI, Radix UI, lucide-react
- [ ] T004 Install form dependencies: React Hook Form, Zod
- [ ] T005 Install testing dependencies: Vitest, React Testing Library, Playwright, @testing-library/user-event
- [ ] T006 Configure TypeScript paths alias (@/ → src root) in tsconfig.json
- [ ] T007 Configure Tailwind CSS with Next.js in tailwind.config.js
- [ ] T008 Configure Shadcn UI components (run init and add core components)
- [ ] T009 Create project directory structure per plan.md (app/, components/, lib/, tests/)
- [ ] T010 Create root layout file at app/layout.tsx with metadata and providers
- [ ] T011 Create .env.local file with environment variables (DEBUG=false)
- [ ] T012 Verify project builds successfully with `npm run build`

---

## Phase 2: Foundational Infrastructure (Blocking Prerequisites)

### Goal
Implement storage layer and utility functions that all user stories depend on.

### Independent Test Criteria
- All storage operations work in isolation
- IndexedDB initialized correctly on app start
- Data persists across page refresh
- CRUD operations return correct types and handle errors
- localStorage session state syncs correctly

---

- [ ] T013 Create TypeScript type definitions in lib/types.ts (Deck, Flashcard, SessionState interfaces)
- [ ] T014 Create utility functions in lib/utils.ts (ID generation, date formatting, validation helpers)
- [ ] T015 Implement storage abstraction layer in lib/storage.ts:
  - [ ] T015a Implement IndexedDB database initialization (onupgradeneeded)
  - [ ] T015b Implement Deck CRUD operations (createDeck, getDeck, getAllDecks, updateDeck, deleteDeck)
  - [ ] T015c Implement Flashcard CRUD operations (createCard, getCardsByDeck, updateCard, deleteCard)
  - [ ] T015d Implement session state operations (setSessionState, getSessionState, clearSessionState)
  - [ ] T015e Implement error handling classes (ValidationError, NotFoundError, QuotaExceededError, StorageError)
- [ ] T016 Create error boundary component in components/ErrorBoundary.tsx for app-wide error handling
- [ ] T017 Create SessionContext in lib/context/SessionContext.tsx for session state management
- [ ] T018 Initialize storage in root layout (app/layout.tsx) on app mount via `initializeStorage()`
- [ ] T019 Create unit tests for storage layer in tests/unit/storage.test.ts:
  - [ ] T019a Test Deck operations (create, read, update, delete)
  - [ ] T019b Test Flashcard operations (create, read, update, delete with cascade)
  - [ ] T019c Test session state operations
  - [ ] T019d Test error handling and validation
  - [ ] T019e Test data persistence across mock page refresh
- [ ] T020 Verify storage tests pass: `npm run test -- storage.test.ts`

---

## Phase 3: User Story 1 - Create Text-Based Flashcard Deck (P1)

### Goal
Enable users to create a new deck and add multiple flashcards with front/back text.

### Independent Test Criteria
- User can create a deck with a name
- User can add cards with front and back text to a deck
- Cards are saved and appear in the card list immediately
- Validation prevents saving empty front/back text
- Created deck and cards persist after page refresh

---

- [ ] T021 [US1] Create DeckForm component in components/DeckForm.tsx:
  - Form inputs: deck name
  - Validation: name required, 1-200 chars
  - Submit handler: calls createDeck() from storage
  - Error display for validation failures
- [ ] T022 [US1] Create CardForm component in components/CardForm.tsx:
  - Form inputs: front text (textarea), back text (textarea)
  - Validation: both required, 1-500 chars each
  - Character count indicators
  - Submit handler: calls createCard() with deckId, frontText, backText
- [ ] T023 [US1] Create DeckDetail page at app/deck/[id]/page.tsx:
  - Load deck data from storage on mount
  - Load cards list from storage with useEffect
  - Display deck name and card count
  - Render card list (DeckCardsList component)
  - "Add Card" button triggers CardForm dialog
- [ ] T024 [US1] Create DeckCardsList component in components/DeckCardsList.tsx:
  - Displays cards in order (by order field)
  - Shows front text for each card
  - Edit and Delete buttons per card
  - Empty state message if no cards
  - Loading spinner during fetch
- [ ] T025 [P] [US1] Create unit tests for DeckForm in tests/unit/components/DeckForm.test.tsx:
  - Test form rendering
  - Test validation error display
  - Test form submission calls createDeck
  - Test disabled submit while submitting
- [ ] T026 [P] [US1] Create unit tests for CardForm in tests/unit/components/CardForm.test.tsx:
  - Test form rendering with/without initial card
  - Test validation errors for empty fields
  - Test character count display
  - Test form submission calls createCard or updateCard
- [ ] T027 [P] [US1] Create integration tests in tests/integration/user-story-1.test.tsx:
  - Create deck → verify appears in storage
  - Add card to deck → verify saved and visible
  - Add 5 different cards → verify all appear in list
  - Validation prevents saving empty front/back text
  - Data persists after simulated refresh
- [ ] T028 [P] [US1] Create E2E test in tests/e2e/user-story-1.spec.ts using Playwright:
  - User creates deck with name
  - User adds 5 cards with different questions/answers
  - User verifies all cards appear in list
  - User refreshes page and verifies data persists

---

## Phase 4: User Story 2 - View and Manage Decks from Dashboard (P1)

### Goal
Display all user decks on dashboard with names and card counts; enable navigation to decks.

### Independent Test Criteria
- Dashboard displays all created decks
- Each deck shows name and card count
- Empty state message shown when no decks
- User can click deck to navigate to detail page
- Dashboard updates when new deck created

---

- [ ] T029 [US2] Create DeckCard component in components/DeckCard.tsx:
  - Display deck name (heading)
  - Display card count (e.g., "15 cards")
  - Study button (navigates to /deck/[id]/study)
  - Edit button (navigates to /deck/[id])
  - Delete button with confirmation dialog
  - Styling: Shadcn Card with hover effects
- [ ] T030 [US2] Create Dashboard component in components/Dashboard.tsx:
  - Load all decks from storage on mount
  - Handle loading and error states
  - Render grid of DeckCard components
  - "Create New Deck" button triggers DeckForm dialog
  - Listen for storage changes to update deck list
- [ ] T031 [US2] Create Dashboard page at app/page.tsx:
  - Render Dashboard component
  - Handle deck creation workflow (show form dialog, save, refresh list)
  - Empty state: "Create your first deck" message if no decks
- [ ] T032 [US2] Create DashboardHeader component in components/DashboardHeader.tsx:
  - App title/logo
  - "Create New Deck" button
- [ ] T033 [P] [US2] Create unit tests for DeckCard in tests/unit/components/DeckCard.test.tsx:
  - Test deck info display (name, card count)
  - Test button handlers
  - Test delete confirmation dialog
- [ ] T034 [P] [US2] Create unit tests for Dashboard in tests/unit/components/Dashboard.test.tsx:
  - Test rendering deck list
  - Test loading state
  - Test empty state when no decks
  - Test create deck workflow
- [ ] T035 [P] [US2] Create integration tests in tests/integration/user-story-2.test.tsx:
  - Create 3 decks with different names
  - Dashboard displays all decks
  - Each deck shows correct name and card count
  - Empty state before any decks created
  - Clicking deck navigates to detail page
- [ ] T036 [P] [US2] Create E2E test in tests/e2e/user-story-2.spec.ts using Playwright:
  - App loads and shows empty state
  - User creates deck and sees it on dashboard
  - User creates 2 more decks
  - Dashboard shows all 3 decks with correct info
  - User can click each deck to open detail page

---

## Phase 5: User Story 3 - Study Mode - Flip Through Flashcards (P1)

### Goal
Implement study mode with card display, flip animation, and navigation between cards.

### Independent Test Criteria
- User can enter study mode from deck detail page
- Cards display one at a time with front text visible
- User can flip card to reveal back text
- User can navigate to next/previous cards
- Study complete message shown at end
- Keyboard shortcuts work (Space to flip, Arrow keys to navigate)
- Session state persists during navigation

---

- [ ] T037 [US3] Create StudyCard component in components/StudyCard.tsx:
  - Props: card (Flashcard), isFlipped (boolean), onFlip callback, cardIndex, cardCount
  - Display progress counter (e.g., "3 of 10")
  - Large card display with front or back text based on isFlipped
  - Flip animation using CSS 3D transforms
  - Click handler to trigger onFlip
  - "Click to flip" hint text
  - Accessibility: aria-label for screen reader
- [ ] T038 [US3] Create StudyMode component in components/StudyMode.tsx:
  - Props: deckId
  - Load deck and cards on mount
  - State: currentCardIndex (0-based), isFlipped (boolean)
  - Render StudyCard with current card
  - Previous/Next/Exit buttons with handlers
  - Progress display (e.g., "Card 3 of 10")
  - Study complete message on last card
  - Session state management via Context
  - Keyboard handlers: Space/Enter (flip), ArrowLeft (prev), ArrowRight (next), Escape (exit)
- [ ] T039 [US3] Create StudyPage at app/deck/[id]/study/page.tsx:
  - Load from route params (deckId)
  - Render StudyMode component
  - Restore session state (card index, flip state) if returning from another page
- [ ] T040 [US3] Create unit tests for StudyCard in tests/unit/components/StudyCard.test.tsx:
  - Test front text display initially
  - Test flip state changes display
  - Test click triggers onFlip callback
  - Test progress counter display
- [ ] T041 [P] [US3] Create integration tests in tests/integration/user-story-3.test.tsx:
  - Load study mode with 10-card deck
  - Card 1 displays with front text
  - Click flip → back text appears
  - Click flip again → front text reappears
  - Next button → advances to card 2
  - Previous button → goes back to card 1
  - Navigation through all 10 cards
  - Study complete message on last card
  - Session state restores if component unmounts/remounts
- [ ] T042 [P] [US3] Create E2E test in tests/e2e/user-story-3.spec.ts using Playwright:
  - User navigates to deck with 10 cards
  - User clicks "Start Study"
  - User sees first card with front text
  - User clicks card to flip → sees back text
  - User clicks flip again → sees front text
  - User clicks Next button → sees card 2
  - User navigates through all cards
  - User sees study complete message
  - User presses keyboard: Space (flip), ArrowRight (next), ArrowLeft (prev)
  - User refreshes page → session state restored (still on same card)

---

## Phase 6: User Story 4 - Exit and Resume Deck Management (P2)

### Goal
Enable users to exit study mode and navigate between decks without losing state.

### Independent Test Criteria
- User can exit study mode and return to deck detail page
- User can navigate from deck detail to dashboard
- Deck state preserved when re-entering study mode
- Session state cleared when switching decks

---

- [ ] T043 [US4] Add exit handlers to StudyMode component:
  - "Back to Deck" button → navigate to /deck/[id]
  - Escape key also triggers exit
  - Save session state before exit (optional - can resume later)
- [ ] T044 [US4] Update DeckDetail page to add navigation:
  - "Back to Dashboard" button navigates to /
  - "Study" button navigates to /deck/[id]/study
- [ ] T045 [US4] Update SessionContext to handle deck switching:
  - clearSessionState when switching to different deck
  - preserveSessionState when returning to same deck
- [ ] T046 [P] [US4] Create integration tests in tests/integration/user-story-4.test.tsx:
  - Enter study mode → exit → return to deck → state preserved
  - Navigate between multiple decks without losing data
  - Session cleared when opening different deck
- [ ] T047 [P] [US4] Create E2E test in tests/e2e/user-story-4.spec.ts using Playwright:
  - User creates 2 decks with cards
  - User enters study mode on deck 1 (advances to card 3)
  - User exits study mode
  - User verifies still viewing deck 1
  - User navigates back to dashboard
  - User opens deck 2 and studies
  - User exits and navigates to deck 1
  - User verifies session state reset (back to card 1)

---

## Phase 7: Polish & Cross-Cutting Concerns

### Goal
Complete testing, optimize performance, improve accessibility, and prepare for deployment.

### Independent Test Criteria
- All unit/integration/E2E tests pass
- No TypeScript errors
- App responsive on mobile and desktop
- Accessibility standards met (WCAG AA)
- Performance: <500ms interaction response
- App works offline (no network requests)

---

- [ ] T048 [P] Create unit tests for utility functions in tests/unit/utils.test.ts:
  - ID generation unique
  - Date formatting correct
  - Validation helpers work
- [ ] T049 [P] Create unit tests for SessionContext in tests/unit/context/SessionContext.test.ts:
  - State updates persist to localStorage
  - State restores from localStorage on init
  - clearSessionState removes all data
- [ ] T050 Run all tests and verify passing:
  - `npm run test` - all unit tests pass
  - `npm run test:integration` - all integration tests pass
  - `npm run test:e2e` - all E2E tests pass
  - Coverage target: >80% for critical paths
- [ ] T051 Create responsive design tests in tests/e2e/responsive.spec.ts:
  - Test on mobile (375px width)
  - Test on tablet (768px width)
  - Test on desktop (1920px width)
  - All interactions work on all sizes
- [ ] T052 Create accessibility tests in tests/e2e/accessibility.spec.ts:
  - Keyboard navigation (Tab through all controls)
  - Screen reader text available
  - Color contrast sufficient
  - Focus indicators visible
- [ ] T053 Optimize performance:
  - Code split study page (lazy load)
  - Memoize heavy components (React.memo, useMemo)
  - Batch IndexedDB writes (debounce session save)
  - Verify Core Web Vitals with Lighthouse
- [ ] T054 Implement offline detection and messaging:
  - Show banner if localStorage unavailable
  - Handle quota exceeded gracefully
  - Display user-friendly error messages
- [ ] T055 Create README.md with:
  - Project overview
  - Setup instructions
  - Running development server
  - Running tests
  - Building for production
  - Deployment options
- [ ] T056 Create CONTRIBUTING.md with:
  - Development workflow
  - Code style guide
  - Testing requirements
  - PR process
- [ ] T057 Configure production build:
  - `next.config.js` optimization settings
  - Environment variable handling
  - Static export (if deploying to CDN)
- [ ] T058 Build and test production bundle:
  - `npm run build`
  - `npm start` to run production build locally
  - Verify all features work in production
- [ ] T059 Add PWA capability (optional):
  - Create public/manifest.json for web app metadata
  - Add service worker for offline support (optional)
  - Install prompt on supported browsers
- [ ] T060 Deploy to hosting platform:
  - Choose platform (Vercel, Netlify, GitHub Pages, etc.)
  - Configure deployment
  - Run final E2E tests in production
  - Document deployment process

---

## Task Dependency Graph

```
Phase 1: Setup
    ↓
Phase 2: Storage Layer (BLOCKING - all stories depend on)
    ↓
    ├─→ Phase 3: User Story 1 (Create Decks/Cards) ┐
    ├─→ Phase 4: User Story 2 (Dashboard) ────────┼─→ Phase 6: Polish & Deployment
    └─→ Phase 5: User Story 3 (Study Mode) ───────┘
        ↓
    Phase 5.5: User Story 4 (Navigation)
```

### Parallelizable Tasks

**After Phase 2 is complete:**
- Phase 3 (US1) can proceed in parallel with Phase 4 and Phase 5
- DeckForm, CardForm, Dashboard, DeckCard components can be developed independently
- StudyCard, StudyMode can be developed independently
- Component tests can run in parallel

**Example parallel execution:**
- Developer A: Work on Phase 3 (Deck/Card creation)
- Developer B: Work on Phase 4 (Dashboard display)
- Developer C: Work on Phase 5 (Study mode)
- After each phase completes, run tests before merging

---

## MVP Scope (Recommended Start)

**Minimum Viable Product = User Stories 1-3 (all P1)**

This delivers:
1. Users can create decks and add cards (Story 1)
2. Users see all decks on dashboard (Story 2)
3. Users can study cards with flip and navigation (Story 3)

**Tasks to complete for MVP**: T001-T047 (all phases 1-5)

**Estimated tasks per story**:
- Story 1: 8 implementation tasks + 4 test tasks = 12 total
- Story 2: 6 implementation tasks + 4 test tasks = 10 total
- Story 3: 4 implementation tasks + 4 test tasks = 8 total

**Enhancement (User Story 4)**: 5 tasks (T043-T047)
**Polish (Phase 7)**: 13 tasks (T048-T060)

---

## Testing Summary

| Type | Location | Trigger | Coverage |
|------|----------|---------|----------|
| Unit | tests/unit/ | `npm run test` | Storage, utilities, form logic |
| Integration | tests/integration/ | `npm run test:integration` | Component interactions with storage |
| E2E | tests/e2e/ | `npm run test:e2e` | Full user journeys |
| Responsive | tests/e2e/responsive.spec.ts | `npm run test:e2e` | Mobile/tablet/desktop |
| Accessibility | tests/e2e/accessibility.spec.ts | `npm run test:e2e` | WCAG AA compliance |

---

## Success Criteria Mapping

| Story | Requirement | Supporting Tasks |
|-------|-------------|------------------|
| US1 | Create deck with name | T021, T025, T027-T028 |
| US1 | Add cards with front/back | T022, T026, T027-T028 |
| US1 | Validate non-empty fields | T022, T024, T026 |
| US1 | Persist data | T013-T020, T027-T028 |
| US2 | Display all decks | T029-T031, T034-T036 |
| US2 | Show deck name & card count | T029, T030, T035-T036 |
| US2 | Empty state message | T031, T034-T035 |
| US3 | Display cards one at a time | T037, T041-T042 |
| US3 | Flip to show back text | T037, T038, T041-T042 |
| US3 | Navigate prev/next cards | T038, T041-T042 |
| US3 | Study complete message | T038, T041-T042 |
| US3 | Keyboard shortcuts | T038, T042 |
| US4 | Exit study mode | T043, T046-T047 |
| US4 | Preserve session state | T038, T045-T047 |

---

## Notes

- All paths use absolute file paths (e.g., `app/`, `components/`, `tests/`, `lib/`)
- Tasks marked [P] can be parallelized (different files, no blocking dependencies)
- Each user story (T0XX [USN]) forms an independently testable increment
- Tests are comprehensive but optional - core implementation tasks (T0XX without test label) are sufficient for MVP
- Phase 2 (storage layer) is critical - all other phases depend on it
- Suggested approach: Implement Phase 1+2+3+5 first for quick MVP, then add Polish and optional enhancements
