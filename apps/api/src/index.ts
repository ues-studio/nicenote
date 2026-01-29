import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/d1'
import { notes } from './db/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

app.get('/', (c) => c.json({ status: 'ok', message: 'Nicenote API is running' }))

const noteSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
})

const routes = app
  .get('/notes', async (c) => {
    const db = drizzle(c.env.DB)
    const result = await db.select().from(notes).orderBy(desc(notes.updatedAt)).all()
    return c.json(result)
  })
  .get('/notes/:id', async (c) => {
    const id = c.req.param('id')
    const db = drizzle(c.env.DB)
    const result = await db.select().from(notes).where(eq(notes.id, id)).get()
    if (!result) return c.json({ error: 'Not found' }, 404)
    return c.json(result)
  })
  .post('/notes', zValidator('json', noteSchema), async (c) => {
    const body = c.req.valid('json')
    const db = drizzle(c.env.DB)
    const result = await db.insert(notes).values({
      title: body.title || 'Untitled',
      content: body.content || '',
    }).returning().get()
    return c.json(result)
  })
  .patch('/notes/:id', zValidator('json', noteSchema), async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const db = drizzle(c.env.DB)
    
    const result = await db
      .update(notes)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, id))
      .returning()
      .get()
    
    if (!result) return c.json({ error: 'Not found' }, 404)
    return c.json(result)
  })
  .delete('/notes/:id', async (c) => {
    const id = c.req.param('id')
    const db = drizzle(c.env.DB)
    await db.delete(notes).where(eq(notes.id, id))
    return c.json({ success: true })
  })

export type AppType = typeof routes
export default app
