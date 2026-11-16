import { serve } from '@hono/node-server'
import { createApp } from './app'
import { createDeps, createMemoryDeps } from './deps'

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env
const createLocalDeps = () => {
  if (SUPABASE_URL && SUPABASE_SECRET_KEY) return createDeps({ SUPABASE_URL, SUPABASE_SECRET_KEY })
  console.warn('SUPABASE_* 未設定のため memory 実装で起動します')
  return createMemoryDeps()
}
const deps = createLocalDeps()

const port = 3000
console.log(`Port: ${port}`)

serve({
  fetch: createApp(deps).fetch,
  port,
})
