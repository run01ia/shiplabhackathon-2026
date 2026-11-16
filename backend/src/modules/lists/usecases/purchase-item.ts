import type { ListRepo } from '../repository'
import { getItemOrThrow, getOwnedList, getShoppingList, toDetail } from './guards'

/** 品目を購入済みにして、価格を入れる (買い物中だけ) */
export const purchaseItem =
  (d: { lists: ListRepo }) =>
  async (userId: string, listId: string, itemId: string, price: number) => {
    await getShoppingList(d.lists, userId, listId)
    await getItemOrThrow(d.lists, listId, itemId)
    await d.lists.updateItem(itemId, { price, isChecked: true })
    return toDetail(d.lists, await getOwnedList(d.lists, userId, listId))
  }
