import type { ListRepo } from '../repository'
import { getShoppingList, toDetail } from './guards'

type Input = { name: string; price: number; isUnnecessary: boolean }

/** リスト外の購入を足す (買い物中だけ。購入済みとして入る) */
export const addExtraItem =
  (d: { lists: ListRepo }) => async (userId: string, listId: string, input: Input) => {
    const list = await getShoppingList(d.lists, userId, listId)
    await d.lists.addItem(listId, {
      name: input.name,
      price: input.price,
      isChecked: true,
      isExtra: true,
      isUnnecessary: input.isUnnecessary,
    })
    return toDetail(d.lists, list)
  }
