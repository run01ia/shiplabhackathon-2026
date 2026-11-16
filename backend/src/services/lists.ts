import { judgeShopping, toJstDate } from '../domain'
import type { List, ListItem, ListRepo, ProfileRepo, WalletRepo } from '../repositories/types'
import { AppError } from './errors'

type Deps = { lists: ListRepo; profiles: ProfileRepo; wallets: WalletRepo; clock: () => Date }

const HISTORY_LIMIT = 50

const sumSpent = (items: ListItem[]) =>
  items.reduce((sum, i) => sum + (i.isChecked ? (i.price ?? 0) : 0), 0)

export const createListService = (d: Deps) => {
  /** 本人のリストだけ。他人・なしは 404。finished は state 側で弾く */
  const owned = async (userId: string, listId: string): Promise<List> => {
    const list = await d.lists.getOwned(userId, listId)
    if (!list) throw new AppError('not_found', 'list not found')
    return list
  }
  const editable = async (userId: string, listId: string) => {
    const list = await owned(userId, listId)
    if (list.status === 'finished') throw new AppError('conflict', 'list already finished')
    return list
  }
  const shopping = async (userId: string, listId: string) => {
    const list = await owned(userId, listId)
    if (list.status !== 'shopping') throw new AppError('conflict', 'list is not in shopping')
    return list
  }
  const item = async (listId: string, itemId: string) => {
    const found = await d.lists.getItem(listId, itemId)
    if (!found) throw new AppError('not_found', 'item not found')
    return found
  }
  const detail = async (list: List) => {
    const items = await d.lists.listItems(list.id)
    const spent = sumSpent(items)
    return { list, items, spent, remaining: list.budget - spent }
  }

  return {
    async create(userId: string, budget: number) {
      if (await d.lists.getActive(userId)) {
        throw new AppError('conflict', 'an unfinished list already exists')
      }
      return detail(await d.lists.create(userId, budget, d.clock()))
    },

    async current(userId: string) {
      const list = await d.lists.getActive(userId)
      if (!list) throw new AppError('not_found', 'no active list')
      return detail(list)
    },

    async updateBudget(userId: string, listId: string, budget: number) {
      await editable(userId, listId)
      return detail(await d.lists.update(listId, { budget }))
    },

    async addItem(userId: string, listId: string, name: string) {
      await editable(userId, listId)
      return d.lists.addItem(listId, {
        name,
        price: null,
        isChecked: false,
        isExtra: false,
        isUnnecessary: false,
      })
    },

    async renameItem(userId: string, listId: string, itemId: string, name: string) {
      await editable(userId, listId)
      await item(listId, itemId)
      return d.lists.updateItem(itemId, { name })
    },

    async deleteItem(userId: string, listId: string, itemId: string) {
      await editable(userId, listId)
      await item(listId, itemId)
      await d.lists.deleteItem(itemId)
    },

    async start(userId: string, listId: string) {
      const list = await owned(userId, listId)
      if (list.status !== 'planning') throw new AppError('conflict', 'list already started')
      return detail(await d.lists.update(listId, { status: 'shopping' }))
    },

    async purchase(userId: string, listId: string, itemId: string, price: number) {
      await shopping(userId, listId)
      await item(listId, itemId)
      await d.lists.updateItem(itemId, { price, isChecked: true })
      return detail(await owned(userId, listId))
    },

    async addExtra(
      userId: string,
      listId: string,
      input: { name: string; price: number; isUnnecessary: boolean },
    ) {
      const list = await shopping(userId, listId)
      await d.lists.addItem(listId, {
        name: input.name,
        price: input.price,
        isChecked: true,
        isExtra: true,
        isUnnecessary: input.isUnnecessary,
      })
      return detail(list)
    },

    async finish(userId: string, listId: string, spentAmount?: number) {
      const list = await shopping(userId, listId)
      const items = await d.lists.listItems(listId)
      const spent = spentAmount ?? sumSpent(items)
      const judgement = judgeShopping({ budget: list.budget, spent, items })
      const finished = await d.lists.update(listId, {
        status: 'finished',
        spentAmount: spent,
        finishedAt: d.clock().toISOString(),
      })
      // 買い物の判定日を記録する (ログイン報酬の「買い物に行かなかった日」の判定に使う)
      await d.profiles.markShoppingJudged(userId, toJstDate(d.clock()))
      for (const line of judgement.breakdown) {
        await d.wallets.addPoints(userId, line.points, line.label)
      }
      return { list: finished, items, ...judgement }
    },

    async history(userId: string) {
      const rows = await d.lists.listFinished(userId, HISTORY_LIMIT)
      return rows.map(({ list, items }) => ({ list, items }))
    },

    /** 完了後の修正。ポイントは再計算しない (MVP) */
    async fixHistoryItem(
      userId: string,
      itemId: string,
      patch: { price?: number; isUnnecessary?: boolean },
    ) {
      const found = await d.lists.getFinishedItem(userId, itemId)
      if (!found) throw new AppError('not_found', 'item not found')
      return d.lists.updateItem(itemId, patch)
    },
  }
}

export type ListService = ReturnType<typeof createListService>
