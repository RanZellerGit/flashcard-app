import { pgTable, varchar, integer, timestamp, boolean, index } from 'drizzle-orm/pg-core'

export const decks = pgTable(
  'decks',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    createdDate: timestamp('created_date', { withTimezone: true }).notNull().defaultNow(),
    updatedDate: timestamp('updated_date', { withTimezone: true }).notNull().defaultNow(),
    cardCount: integer('card_count').notNull().default(0),
    userId: varchar('user_id', { length: 255 }).notNull(),
  },
  (table) => [
    index('idx_decks_user_id').on(table.userId),
    index('idx_decks_user_created').on(table.userId, table.createdDate),
  ]
)

export const flashcards = pgTable(
  'flashcards',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    deckId: varchar('deck_id', { length: 64 })
      .notNull()
      .references(() => decks.id, { onDelete: 'cascade' }),
    frontText: varchar('front_text', { length: 500 }).notNull(),
    backText: varchar('back_text', { length: 500 }).notNull(),
    cardOrder: integer('card_order').notNull().default(0),
    isKnown: boolean('is_known').notNull().default(false),
    knownCount: integer('known_count').notNull().default(0),
    createdDate: timestamp('created_date', { withTimezone: true }).notNull().defaultNow(),
    userId: varchar('user_id', { length: 255 }).notNull(),
  },
  (table) => [
    index('idx_flashcards_deck_id').on(table.deckId),
    index('idx_flashcards_user_id').on(table.userId),
  ]
)

export type DeckRow = typeof decks.$inferSelect
export type NewDeckRow = typeof decks.$inferInsert
export type FlashcardRow = typeof flashcards.$inferSelect
export type NewFlashcardRow = typeof flashcards.$inferInsert
