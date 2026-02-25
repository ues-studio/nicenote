import type { AppType } from 'api'
import { hc } from 'hono/client'

const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || '/api'

const client = hc<AppType>(apiBaseUrl)

export const api = client

export async function throwApiError(res: Response, fallback: string): Promise<never> {
  try {
    const body = (await res.json()) as { error?: string }
    throw new Error(body.error ?? fallback)
  } catch (err) {
    if (err instanceof Error && err.message !== fallback) throw err
    throw new Error(fallback)
  }
}
