import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { nanoid } from 'nanoid'

export const notes = sqliteTable(
  'notes',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    title: text('title').default('Untitled').notNull(),
    content: text('content'), // Markdown
    createdAt: text('created_at')
      .$defaultFn(() => new Date().toISOString())
      .notNull(),
    updatedAt: text('updated_at')
      .$defaultFn(() => new Date().toISOString())
      .notNull(),
  },
  (table) => [index('idx_notes_updated_at').on(table.updatedAt)]
)
