import { z } from 'zod'

const isoDateTimeSchema = z.string().datetime({ offset: true })

export const noteSelectSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    content: z.string().nullable(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict()

export const noteInsertSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    content: z.string().nullable().optional(),
    createdAt: isoDateTimeSchema.optional(),
    updatedAt: isoDateTimeSchema.optional(),
  })
  .strict()

export const noteCreateSchema = noteInsertSchema.pick({
  title: true,
  content: true,
})

export const noteUpdateSchema = z
  .object({
    title: z.string().optional(),
    content: z.string().nullable().optional(),
  })
  .strict()
  .refine((input) => input.title !== undefined || input.content !== undefined, {
    message: 'At least one field must be provided for update',
  })

export const noteIdParamSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict()

export const noteListQuerySchema = z.object({
  cursor: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
})

export type NoteSelect = z.infer<typeof noteSelectSchema>
export type NoteInsert = z.infer<typeof noteInsertSchema>
export type NoteCreateInput = z.infer<typeof noteCreateSchema>
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>
export type NoteListQuery = z.infer<typeof noteListQuerySchema>

export interface NoteListResult {
  data: NoteSelect[]
  nextCursor: string | null
}

export interface NoteContractService {
  list: (query: NoteListQuery) => Promise<NoteListResult> | NoteListResult
  getById: (id: string) => Promise<NoteSelect | null> | NoteSelect | null
  create: (input: NoteCreateInput) => Promise<NoteSelect> | NoteSelect
  update: (id: string, input: NoteUpdateInput) => Promise<NoteSelect | null> | NoteSelect | null
  remove: (id: string) => Promise<boolean> | boolean
}
