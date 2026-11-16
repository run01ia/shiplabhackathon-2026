import type { List, PointLog, Profile, Repositories, Wallet } from '../types'

// interface を満たす Map ベースの実装。後からテストで使う
export type MemoryStore = {
  profiles: Map<string, Profile>
  lists: Map<string, List>
  wallets: Map<string, Wallet>
  logs: Map<string, PointLog[]>
  /** 着せ替えマスタ (supabase の初期データと同じ) */
  items: { key: string; name: string; price: number }[]
  /** userId -> (itemKey -> equipped) */
  userItems: Map<string, Map<string, boolean>>
}

export const createMemoryStore = (): MemoryStore => ({
  profiles: new Map(),
  lists: new Map(),
  wallets: new Map(),
  logs: new Map(),
  items: [
    { key: 'hat', name: 'ぼうし', price: 30 },
    { key: 'ribbon', name: 'リボン', price: 40 },
    { key: 'crown', name: 'おうかん', price: 200 },
    { key: 'glasses', name: 'めがね', price: 60 },
  ],
  userItems: new Map(),
})

export const createMemoryRepositories = (
  s: MemoryStore = createMemoryStore(),
): Repositories => {
  // supabase ではサインアップ時のトリガーで作られる行を、初回アクセスで作る
  const ensure = (id: string) => {
    if (!s.profiles.has(id)) {
      s.profiles.set(id, {
        id,
        petName: 'ぷち',
        lastLoginRewardOn: null,
        lastShoppingJudgedOn: null,
      })
      s.wallets.set(id, { coins: 0, score: 0, level: 1, exp: 0 })
    }
    return { profile: s.profiles.get(id)!, wallet: s.wallets.get(id)! }
  }
  const owned = (id: string) => {
    let m = s.userItems.get(id)
    if (!m) s.userItems.set(id, (m = new Map()))
    return m
  }

  const wallets: Repositories['wallets'] = {
    get: async (id) => ensure(id).wallet,
    save: async (id, w) => {
      ensure(id)
      s.wallets.set(id, w)
    },
    addPoints: async (id, delta, reason) => {
      const { wallet } = ensure(id)
      const next = { ...wallet, coins: Math.max(wallet.coins + delta, 0), score: wallet.score + delta }
      s.wallets.set(id, next)
      const logs = s.logs.get(id) ?? []
      logs.unshift({
        id: crypto.randomUUID(),
        delta,
        reason,
        createdAt: new Date().toISOString(),
      })
      s.logs.set(id, logs)
      return next
    },
    listLogs: async (id, limit) => (s.logs.get(id) ?? []).slice(0, limit),
  }

  return {
    profiles: {
      get: async (id) => ensure(id).profile,
      claimLoginReward: async (id, today) => {
        const { profile } = ensure(id)
        if (profile.lastLoginRewardOn === today) return false
        s.profiles.set(id, { ...profile, lastLoginRewardOn: today })
        return true
      },
    },
    lists: {
      getActive: async (userId) =>
        [...s.lists.values()].find((l) => l.userId === userId && l.status !== 'finished') ?? null,
    },
    wallets,
    shop: {
      listItems: async (id) => {
        const mine = owned(id)
        return s.items.map((i) => ({
          ...i,
          owned: mine.has(i.key),
          equipped: mine.get(i.key) ?? false,
        }))
      },
      buy: async (id, key) => {
        const item = s.items.find((i) => i.key === key)
        if (!item) return { ok: false, reason: 'item_not_found' }
        const mine = owned(id)
        if (mine.has(key)) return { ok: false, reason: 'already_owned' }
        const { wallet } = ensure(id)
        if (wallet.coins < item.price) return { ok: false, reason: 'insufficient_coins' }
        const next = { ...wallet, coins: wallet.coins - item.price }
        s.wallets.set(id, next)
        mine.set(key, false)
        return { ok: true, wallet: next }
      },
      setEquipped: async (id, key, equipped) => {
        if (!s.items.some((i) => i.key === key)) return 'item_not_found'
        const mine = owned(id)
        if (!mine.has(key)) return 'not_owned'
        mine.set(key, equipped)
        return 'ok'
      },
    },
  }
}
