import type { Context } from 'hono'
import type { StatusCode } from 'hono/utils/http-status'

import type { ApiMessageKey } from './i18n'
import { resolveLocale, t } from './i18n'

export class AppError extends Error {
  constructor(
    public readonly messageKey: ApiMessageKey,
    public readonly status: StatusCode = 500,
    cause?: unknown
  ) {
    super(messageKey, { cause })
  }
}

export function handleAppError(err: Error, c: Context) {
  const locale = resolveLocale(c.req.header('accept-language'))

  if (err instanceof AppError) {
    console.error(`[${c.req.method} ${c.req.path}] ${err.messageKey}`, err.cause ?? '')
    return c.json({ error: t(err.messageKey, locale) }, err.status)
  }

  console.error(`[${c.req.method} ${c.req.path}] Unhandled:`, err)
  return c.json({ error: t('internalServerError', locale) }, 500)
}
