import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Deps } from './deps'
import { lists } from './modules/lists/routes'
import { profile } from './modules/profile/routes'
import { shop } from './modules/shop/routes'
import { wallet } from './modules/wallet/routes'
import type { Env } from './shared/env'
import { onError } from './shared/middleware/error'

// モジュールを足したら、ここに `.route('/', xxx(d))` を 1 行足す (認証は各モジュールの routes.ts で掛ける)
export const createApp = (d: Deps) =>
  new Hono<Env>()
    .use(cors({ origin: ['http://localhost:5173'] }))
    .onError(onError)
    .get('/health', (c) => c.json({ ok: true }))
    .route('/', profile(d))
    .route('/', shop(d))
    .route('/', wallet(d))
    .route('/', lists(d))

export type AppType = ReturnType<typeof createApp>
