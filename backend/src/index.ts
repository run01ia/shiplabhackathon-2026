import { serve } from '@hono/node-server'
import { createApp } from './app'
import { createDeps, createMemoryDeps } from './deps'

const { SUPABASE_URL, SUPABASE_SECRET_KEY, CORS_ORIGINS, NODE_ENV } = process.env
const corsOrigins = (CORS_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const createLocalDeps = () => {
  if (SUPABASE_URL && SUPABASE_SECRET_KEY) return createDeps({ SUPABASE_URL, SUPABASE_SECRET_KEY })
  // memory 実装は `Bearer test-<id>` で誰でも通るので、本番では起動させない
  if (NODE_ENV === 'production') throw new Error('SUPABASE_URL と SUPABASE_SECRET_KEY が必要です')
  console.warn('SUPABASE_* 未設定のため memory 実装で起動します')
  return createMemoryDeps()
}
const deps = createLocalDeps()

const port = 3000
console.log(`Port: ${port}`)

serve({
  fetch: createApp(
    deps,
    // 空文字は除き、何も残らなければ既定値 (localhost:5173) にする
    corsOrigins.length > 0 ? corsOrigins : undefined,
  ).fetch,
  port,
})
