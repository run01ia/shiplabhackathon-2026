import type { FinishedList, List, ListItem, ListRepo } from '../repository'

// interface を満たす Map ベースの実装 (DB なしのローカル確認に使う)
export const createMemoryListRepo = (): ListRepo => {
  const lists = new Map<string, List>()
  const listItems = new Map<string, ListItem>()
  const itemsOf = (listId: string) => [...listItems.values()].filter((i) => i.listId === listId)

  return {
    getActive: async (userId) =>
      [...lists.values()].find((l) => l.userId === userId && l.status !== 'finished') ?? null,
    getOwned: async (userId, listId) => {
      const l = lists.get(listId)
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
      lists.set(list.id, list)
      return list
    },
    update: async (listId, patch) => {
      const cur = lists.get(listId)
      if (!cur) throw new Error('list not found')
      const next = { ...cur, ...patch }
      lists.set(listId, next)
      return next
    },
    listItems: async (listId) => itemsOf(listId),
    addItem: async (listId, item) => {
      const created: ListItem = { id: crypto.randomUUID(), listId, ...item }
      listItems.set(created.id, created)
      return created
    },
    getItem: async (listId, itemId) => {
      const i = listItems.get(itemId)
      return i && i.listId === listId ? i : null
    },
    updateItem: async (itemId, patch) => {
      const cur = listItems.get(itemId)
      if (!cur) throw new Error('item not found')
      const next = { ...cur, ...patch }
      listItems.set(itemId, next)
      return next
    },
    deleteItem: async (itemId) => {
      listItems.delete(itemId)
    },
    listFinished: async (userId, limit) =>
      [...lists.values()]
        .filter((l) => l.userId === userId && l.status === 'finished')
        .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))
        .slice(0, limit)
        .map((list): FinishedList => ({ list, items: itemsOf(list.id) })),
    getFinishedItem: async (userId, itemId) => {
      const i = listItems.get(itemId)
      const l = i ? lists.get(i.listId) : undefined
      return i && l && l.userId === userId && l.status === 'finished' ? i : null
    },
  }
}
