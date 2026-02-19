import { zValidator } from '@hono/zod-validator'
import { type Env, Hono } from 'hono'
import type { Schema } from 'hono/types'

import {
  type NoteContractService,
  noteCreateSchema,
  noteIdParamSchema,
  noteListItemSchema,
  noteListQuerySchema,
  noteSelectSchema,
  noteUpdateSchema,
} from '@nicenote/shared'

export type NoteContractFactory<E extends Env> = (bindings: E['Bindings']) => NoteContractService

export function registerNoteRoutes<E extends Env, S extends Schema, BasePath extends string>(
  app: Hono<E, S, BasePath>,
  createService: NoteContractFactory<E>
) {
  return app
    .get('/notes', zValidator('query', noteListQuerySchema), async (c) => {
      const service = createService(c.env as E['Bindings'])
      const query = c.req.valid('query')
      const { data, nextCursor } = await service.list(query)
      return c.json({ data: noteListItemSchema.array().parse(data), nextCursor })
    })
    .get('/notes/:id', zValidator('param', noteIdParamSchema), async (c) => {
      const service = createService(c.env as E['Bindings'])
      const { id } = c.req.valid('param')
      const result = await service.getById(id)

      if (!result) return c.json({ error: 'Not found' }, 404)
      return c.json(noteSelectSchema.parse(result))
    })
    .post('/notes', zValidator('json', noteCreateSchema), async (c) => {
      const service = createService(c.env as E['Bindings'])
      const body = c.req.valid('json')
      const result = await service.create(body)
      return c.json(noteSelectSchema.parse(result))
    })
    .patch(
      '/notes/:id',
      zValidator('param', noteIdParamSchema),
      zValidator('json', noteUpdateSchema),
      async (c) => {
        const service = createService(c.env as E['Bindings'])
        const { id } = c.req.valid('param')
        const body = c.req.valid('json')
        const result = await service.update(id, body)

        if (!result) return c.json({ error: 'Not found' }, 404)
        return c.json(noteSelectSchema.parse(result))
      }
    )
    .delete('/notes/:id', zValidator('param', noteIdParamSchema), async (c) => {
      const service = createService(c.env as E['Bindings'])
      const { id } = c.req.valid('param')
      const deleted = await service.remove(id)
      if (!deleted) return c.json({ error: 'Not found' }, 404)
      return c.json({ success: true })
    })
}

function _createContractAppForType() {
  const app = new Hono()

  return registerNoteRoutes(app, () => ({
    list: () => ({ data: [], nextCursor: null }),
    getById: () => null,
    create: () => ({
      id: '',
      title: '',
      content: null,
      createdAt: '',
      updatedAt: '',
    }),
    update: () => null,
    remove: () => false,
  }))
}

export type AppType = ReturnType<typeof _createContractAppForType>
