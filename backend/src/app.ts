import { Hono } from 'hono'
import type { Deps } from './deps'
import type { Env } from './lib/env'
import { onError } from './middleware/error'
import { historyPoints } from './routes/history-points'
import { lists } from './routes/lists'
import { me } from './routes/me'
import { rewards } from './routes/rewards'
import { shop } from './routes/shop'

// 認証が要るルートは `.use('/me/*', auth(d))` のあとに routes/ をチェーンしていく
export const createApp = (d: Deps) =>
  new Hono<Env>()
    .onError(onError)
    .get('/health', (c) => c.json({ ok: true }))
    .route('/', me(d))
    .route('/', rewards(d))
    .route('/', shop(d))
    .route('/', historyPoints(d))
    .route('/', lists(d))

export type AppType = ReturnType<typeof createApp>
