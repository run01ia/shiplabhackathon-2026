import { serve } from '@hono/node-server'
import { createApp } from './app'
import { createDeps, createMemoryDeps } from './deps'
import { createMemoryReceiptReader } from './modules/receipts/infra/memory'

const {
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  ANTHROPIC_API_KEY,
  RECEIPT_DAILY_GLOBAL_LIMIT,
  RECEIPT_READER,
  CORS_ORIGINS,
  NODE_ENV,
} = process.env
const corsOrigins = (CORS_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const createLocalDeps = () => {
  if (SUPABASE_URL && SUPABASE_SECRET_KEY) {
    // ANTHROPIC_API_KEY が空なら、レシートの AI 判定は無効 (画面にボタンを出さない)
    return createDeps({
      SUPABASE_URL,
      SUPABASE_SECRET_KEY,
      ANTHROPIC_API_KEY,
      RECEIPT_DAILY_GLOBAL_LIMIT,
    })
  }
  // memory 実装は `Bearer test-<id>` で誰でも通るので、本番では起動させない
  if (NODE_ENV === 'production') throw new Error('SUPABASE_URL と SUPABASE_SECRET_KEY が必要です')
  console.warn('SUPABASE_* 未設定のため memory 実装で起動します')
  return createMemoryDeps()
}
const deps = createLocalDeps()
// DB ありのローカル確認用: Claude API を呼ばず、固定の読み取り結果を返す。
// NODE_ENV=development を明示したときだけ効く (NODE_ENV 未設定の本番で、偽の読み取りにならないように)
if (RECEIPT_READER === 'memory') {
  if (NODE_ENV === 'development') {
    console.warn('RECEIPT_READER=memory: レシートは固定の読み取り結果を返します')
    deps.repos.receiptReader = createMemoryReceiptReader()
  } else if (SUPABASE_URL && SUPABASE_SECRET_KEY) {
    console.warn('RECEIPT_READER=memory は NODE_ENV=development のときだけ有効です (無視します)')
  }
}

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
