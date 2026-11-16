// deps.ts と repositories/supabase/ からだけ import する
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Bindings } from './env'

export type Db = SupabaseClient

// secret キーのクライアント。API の中だけで使い、front へ渡さない
export const createDb = (env: Bindings): Db =>
  createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
