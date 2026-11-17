import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Deps } from './deps'
import { lists } from './modules/lists/routes'
import { profile } from './modules/profile/routes'
import { receipts } from './modules/receipts/routes'
import { shop } from './modules/shop/routes'
import { wallet } from './modules/wallet/routes'
import type { Env } from './shared/env'
import { onError } from './shared/middleware/error'

// モジュールを足したら、ここに `.route('/', xxx(d))` を 1 行足す (認証は各モジュールの routes.ts で掛ける)
// corsOrigins: 画面の URL の許可リスト (staging / 本番は環境変数 CORS_ORIGINS から渡す。`*` にはしない)
export const createApp = (d: Deps, corsOrigins: string[] = ['http://localhost:5173']) =>
  new Hono<Env>()
    .use(cors({ origin: corsOrigins }))
    .onError(onError)
    .get('/health', (c) => c.json({ ok: true }))
    .route('/', profile(d))
    .route('/', shop(d))
    .route('/', wallet(d))
    .route('/', lists(d))
    .route('/', receipts(d))

export type AppType = ReturnType<typeof createApp>
