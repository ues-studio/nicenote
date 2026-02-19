import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { createNoteService, type NoteServiceBindings } from './services/note-service'
import { registerNoteRoutes } from './routes'

const app = new Hono<{ Bindings: NoteServiceBindings }>()

// 中间件配置
app.use('*', (c, next) => {
  if (c.req.path === '/health') return next()
  return logger()(c, next)
})
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://nicenote.app',
  'https://nicenote.pages.dev',
]

app.use(
  '*',
  cors({
    origin: (origin) => (ALLOWED_ORIGINS.includes(origin) ? origin : ''),
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
  })
)

// 全局错误处理
app.onError((err, c) => {
  console.error(`Error: ${err.message}`)
  return c.json({ error: 'Internal Server Error' }, 500)
})

app.get('/', (c) => c.json({ status: 'ok', message: 'Nicenote API is running' }))

export type {
  NoteInsertSchemaMatchesDrizzle,
  NoteSelectSchemaMatchesDrizzle,
} from './services/note-service'

registerNoteRoutes(app, createNoteService)

export type { AppType } from './routes'
export default app
