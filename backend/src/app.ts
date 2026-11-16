import { Hono } from 'hono'
import type { Deps } from './deps'
import type { Env } from './lib/env'
import { onError } from './middleware/error'

// 認証が要るルートは `.use('/me/*', auth(d))` のあとに routes/ をチェーンしていく
export const createApp = (_d: Deps) =>
  new Hono<Env>().onError(onError).get('/health', (c) => c.json({ ok: true }))

export type AppType = ReturnType<typeof createApp>
