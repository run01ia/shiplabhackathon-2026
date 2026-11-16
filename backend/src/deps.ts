// 組み立て場所 (composition root)。infra の実装を import してよいのは、このファイルだけ
import { createMemoryListRepo } from './modules/lists/infra/memory'
import { createSupabaseListRepo } from './modules/lists/infra/supabase'
import type { ListRepo } from './modules/lists/repository'
import { createMemoryProfileRepo } from './modules/profile/infra/memory'
import { createSupabaseProfileRepo } from './modules/profile/infra/supabase'
import type { ProfileRepo } from './modules/profile/repository'
import { createMemoryShopRepo } from './modules/shop/infra/memory'
import { createSupabaseShopRepo } from './modules/shop/infra/supabase'
import type { ShopRepo } from './modules/shop/repository'
import { createMemoryWalletRepo } from './modules/wallet/infra/memory'
import { createSupabaseWalletRepo } from './modules/wallet/infra/supabase'
import type { WalletRepo } from './modules/wallet/repository'
import type { AuthUser, Bindings } from './shared/env'
import { createDb } from './shared/supabase'

export type Repositories = {
  profiles: ProfileRepo
  lists: ListRepo
  wallets: WalletRepo
  shop: ShopRepo
}

export type Deps = {
  clock: () => Date
  random: () => number
  repos: Repositories
  /** Bearer トークンを検証してユーザーを返す。無効なら null */
  verifyToken: (token: string) => Promise<AuthUser | null>
}

/** 本番 (Supabase) の組み立て */
export const createDeps = (env: Bindings): Deps => {
  const db = createDb(env)
  return {
    clock: () => new Date(),
    random: Math.random,
    repos: {
      profiles: createSupabaseProfileRepo(db),
      lists: createSupabaseListRepo(db),
      wallets: createSupabaseWalletRepo(db),
      shop: createSupabaseShopRepo(db),
    },
    verifyToken: async (token) => {
      const { data, error } = await db.auth.getUser(token)
      return error || !data.user ? null : { id: data.user.id }
    },
  }
}

const createMemoryRepositories = (): Repositories => {
  const wallets = createMemoryWalletRepo()
  return {
    profiles: createMemoryProfileRepo(),
    lists: createMemoryListRepo(),
    wallets,
    // memory の購入は、wallet の port 経由でコインを減らす
    shop: createMemoryShopRepo(wallets),
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
