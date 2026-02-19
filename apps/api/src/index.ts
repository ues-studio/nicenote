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
    origin: (origin) => (ALLOWED_ORIGINS.includes(origin) ? origin : null),
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
  })
)

// Per-isolate sliding window rate limiter
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 60

const rateLimitMap = new Map<string, number[]>()

app.use('*', async (c, next) => {
  const ip = c.req.header('cf-connecting-ip') ?? 'unknown'
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS

  let timestamps = rateLimitMap.get(ip)
  if (timestamps) {
    timestamps = timestamps.filter((t) => t > windowStart)
    rateLimitMap.set(ip, timestamps)
  } else {
    timestamps = []
    rateLimitMap.set(ip, timestamps)
  }

  if (timestamps.length >= RATE_LIMIT_MAX) {
    return c.json({ error: 'Too Many Requests' }, 429)
  }

  timestamps.push(now)
  await next()
})

// 全局错误处理
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

app.get('/', (c) => c.json({ status: 'ok', message: 'Nicenote API is running' }))
app.get('/health', (c) => c.json({ status: 'ok' }))

export type {
  NoteInsertSchemaMatchesDrizzle,
  NoteSelectSchemaMatchesDrizzle,
} from './services/note-service'

registerNoteRoutes(app, createNoteService)

export type { AppType } from './routes'
export default app
