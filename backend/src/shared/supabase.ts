// deps.ts と modules/*/infra/ からだけ import する (biome.json の noRestrictedImports で守る)
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Bindings } from './env'

export type Db = SupabaseClient

/** supabase-js が返す行 (snake_case)。infra の中で型 (camelCase) に変換する */
export type Row = Record<string, unknown>

// secret キーのクライアント。API の中だけで使い、front へ渡さない
export const createDb = (env: Bindings): Db =>
  createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
