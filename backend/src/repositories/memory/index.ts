import type {
  FinishedList,
  List,
  ListItem,
  PointLog,
  Profile,
  Repositories,
  Wallet,
} from '../types'

// interface を満たす Map ベースの実装。後からテストで使う
export type MemoryStore = {
  profiles: Map<string, Profile>
  lists: Map<string, List>
  listItems: Map<string, ListItem>
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
  listItems: new Map(),
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

  const itemsOf = (listId: string) =>
    [...s.listItems.values()].filter((i) => i.listId === listId)

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
      markShoppingJudged: async (id, today) => {
        const { profile } = ensure(id)
        s.profiles.set(id, { ...profile, lastShoppingJudgedOn: today })
      },
    },
    lists: {
      getActive: async (userId) =>
        [...s.lists.values()].find((l) => l.userId === userId && l.status !== 'finished') ?? null,
      getOwned: async (userId, listId) => {
        const l = s.lists.get(listId)
        return l && l.userId === userId ? l : null
      },
      create: async (userId, budget, now) => {
        const list: List = {
          id: crypto.randomUUID(),
          userId,
          budget,
          status: 'planning',
          spentAmount: null,
          createdAt: now.toISOString(),
          finishedAt: null,
        }
        s.lists.set(list.id, list)
        return list
      },
      update: async (listId, patch) => {
        const cur = s.lists.get(listId)
        if (!cur) throw new Error('list not found')
        const next = { ...cur, ...patch }
        s.lists.set(listId, next)
        return next
      },
      listItems: async (listId) => itemsOf(listId),
      addItem: async (listId, item) => {
        const created: ListItem = { id: crypto.randomUUID(), listId, ...item }
        s.listItems.set(created.id, created)
        return created
      },
      getItem: async (listId, itemId) => {
        const i = s.listItems.get(itemId)
        return i && i.listId === listId ? i : null
      },
      updateItem: async (itemId, patch) => {
        const cur = s.listItems.get(itemId)
        if (!cur) throw new Error('item not found')
        const next = { ...cur, ...patch }
        s.listItems.set(itemId, next)
        return next
      },
      deleteItem: async (itemId) => {
        s.listItems.delete(itemId)
      },
      listFinished: async (userId, limit) =>
        [...s.lists.values()]
          .filter((l) => l.userId === userId && l.status === 'finished')
          .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))
          .slice(0, limit)
          .map((list): FinishedList => ({ list, items: itemsOf(list.id) })),
      getFinishedItem: async (userId, itemId) => {
        const i = s.listItems.get(itemId)
        const l = i ? s.lists.get(i.listId) : undefined
        return i && l && l.userId === userId && l.status === 'finished' ? i : null
      },
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
