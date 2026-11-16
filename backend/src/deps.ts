import type { AuthUser, Bindings } from './lib/env'
import { createDb } from './lib/supabase'
import { createMemoryRepositories } from './repositories/memory'
import { createSupabaseRepositories } from './repositories/supabase'
import type { Repositories } from './repositories/types'

export type Deps = {
  clock: () => Date
  random: () => number
  repos: Repositories
  /** Bearer トークンを検証してユーザーを返す。無効なら null */
  verifyToken: (token: string) => Promise<AuthUser | null>
}

/** 本番 (Supabase) の組み立て。唯一の組み立て場所 */
export const createDeps = (env: Bindings): Deps => {
  const db = createDb(env)
  return {
    clock: () => new Date(),
    random: Math.random,
    repos: createSupabaseRepositories(db),
    verifyToken: async (token) => {
      const { data, error } = await db.auth.getUser(token)
      return error || !data.user ? null : { id: data.user.id }
    },
  }
}

/** テスト・ローカル確認用 (memory)。必要な項目だけ上書きできる */
export const createMemoryDeps = (overrides: Partial<Deps> = {}): Deps => ({
  clock: () => new Date(),
  random: Math.random,
  repos: createMemoryRepositories(),
  // memory では "test-<userId>" をそのままユーザーとして扱う
  verifyToken: async (token) =>
    token.startsWith('test-') ? { id: token.slice('test-'.length) } : null,
  ...overrides,
})
