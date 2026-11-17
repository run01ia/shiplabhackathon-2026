import type { PantryItem, PantryRepo } from '../repository'

// interface を満たす Map ベースの実装 (DB なしのローカル確認に使う)
export const createMemoryPantryRepo = (): PantryRepo => {
  /** userId -> (key -> item) */
  const users = new Map<string, Map<string, PantryItem>>()
  const mine = (userId: string) => {
    const existing = users.get(userId)
    if (existing) return existing
    const created = new Map<string, PantryItem>()
    users.set(userId, created)
    return created
  }
  const byId = (userId: string, id: string) => [...mine(userId).values()].find((i) => i.id === id)

  return {
    list: async (userId) =>
      [...mine(userId).values()].sort((a, b) => b.stockedAt.localeCompare(a.stockedAt)),
    upsertMany: async (userId, entries, stockedAt) => {
      const items = mine(userId)
      for (const e of entries) {
        const id = items.get(e.key)?.id ?? crypto.randomUUID()
        items.set(e.key, { id, ...e, status: 'have', stockedAt })
      }
    },
    setStatus: async (userId, id, status) => {
      const cur = byId(userId, id)
      if (!cur) return null
      const next = { ...cur, status }
      mine(userId).set(cur.key, next)
      return next
    },
    remove: async (userId, id) => {
      const cur = byId(userId, id)
      return cur ? mine(userId).delete(cur.key) : false
    },
  }
}
