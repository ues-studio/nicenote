import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  title: text('title').default('Untitled').notNull(),
  content: text('content'), // Tiptap JSON
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});
