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

export type NoteSelect = z.infer<typeof noteSelectSchema>
export type NoteInsert = z.infer<typeof noteInsertSchema>
export type NoteCreateInput = z.infer<typeof noteCreateSchema>
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>
