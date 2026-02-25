import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { createNoteService, type NoteServiceBindings } from './services/note-service'
import { handleAppError } from './app-error'
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

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true
  return /^https:\/\/[a-z0-9-]+\.nicenote-web\.pages\.dev$/.test(origin)
}

app.use(
  '*',
  cors({
    origin: (origin) => (isAllowedOrigin(origin) ? origin : null),
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
  })
)

// Rate limiting is handled by Cloudflare WAF Rate Limiting Rules.

// 全局错误处理
app.onError(handleAppError)

app.get('/', (c) => c.json({ status: 'ok', message: 'Nicenote API is running' }))
app.get('/health', (c) => c.json({ status: 'ok' }))

registerNoteRoutes(app, createNoteService)

export type { AppType } from './routes'
export default app
