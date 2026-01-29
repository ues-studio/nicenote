import { hc } from 'hono/client'
import type { AppType } from '../../../api/src/index'

const client = hc<AppType>('http://localhost:8787')

export const api = client
