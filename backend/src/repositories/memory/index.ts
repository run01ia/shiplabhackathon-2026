import type {
  FinishedList,
  List,
  ListItem,
  Profile,
  Repositories,
  Wallet,
} from '../types'

// interface を満たす Map ベースの実装。後からテストで使う
export type PointLog = { userId: string; delta: number; reason: string }

export type MemoryStore = {
  profiles: Map<string, Profile>
  lists: Map<string, List>
  listItems: Map<string, ListItem>
  wallets: Map<string, Wallet>
  pointLogs: PointLog[]
}

export const createMemoryStore = (): MemoryStore => ({
  profiles: new Map(),
  lists: new Map(),
  listItems: new Map(),
  wallets: new Map(),
  pointLogs: [],
})

export const createMemoryRepositories = (
  s: MemoryStore = createMemoryStore(),
): Repositories => {
  const itemsOf = (listId: string) =>
    [...s.listItems.values()].filter((i) => i.listId === listId)
  return {
    profiles: { get: async (id) => s.profiles.get(id) ?? null },
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
    wallets: {
      get: async (id) => s.wallets.get(id) ?? null,
      save: async (id, w) => {
        s.wallets.set(id, w)
      },
      addPoints: async (id, delta, reason) => {
        const w = s.wallets.get(id) ?? { coins: 0, score: 0, level: 1, exp: 0 }
        s.wallets.set(id, { ...w, coins: Math.max(0, w.coins + delta), score: w.score + delta })
        s.pointLogs.push({ userId: id, delta, reason })
      },
    },
  }
}
