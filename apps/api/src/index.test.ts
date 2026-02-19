import { describe, expect, it } from 'vitest'

import app from './index'

describe('api cors', () => {
  it('reflects allowed origin in CORS header', async () => {
    const res = await app.request('/', {
      method: 'GET',
      headers: {
        Origin: 'https://nicenote.app',
      },
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('access-control-allow-origin')).toBe('https://nicenote.app')
  })

  it('returns null origin for disallowed origin', async () => {
    const res = await app.request('/', {
      method: 'GET',
      headers: {
        Origin: 'https://evil.example.com',
      },
    })

    expect(res.status).toBe(200)
    const header = res.headers.get('access-control-allow-origin')
    expect(header === null || header === 'null').toBe(true)
  })
})
