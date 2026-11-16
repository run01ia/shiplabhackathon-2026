import type { List, Profile, Repositories, Wallet } from '../types'

// interface を満たす Map ベースの実装。後からテストで使う
export type MemoryStore = {
  profiles: Map<string, Profile>
  lists: Map<string, List>
  wallets: Map<string, Wallet>
}

export const createMemoryStore = (): MemoryStore => ({
  profiles: new Map(),
  lists: new Map(),
  wallets: new Map(),
})

export const createMemoryRepositories = (
  s: MemoryStore = createMemoryStore(),
): Repositories => ({
  profiles: { get: async (id) => s.profiles.get(id) ?? null },
  lists: {
    getActive: async (userId) =>
      [...s.lists.values()].find((l) => l.userId === userId && l.status !== 'finished') ?? null,
  },
  wallets: {
    get: async (id) => s.wallets.get(id) ?? null,
    save: async (id, w) => {
      s.wallets.set(id, w)
    },
  },
})
