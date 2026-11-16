// 複数の use-case が使う「取得して状態を確かめる」手順。use-case 同士は呼び合わず、共通部分はここに置く
import { AppError } from '../../../shared/errors'
import type { List, ListItem, ListRepo } from '../repository'

export const sumSpent = (items: ListItem[]) =>
  items.reduce((sum, i) => sum + (i.isChecked ? (i.price ?? 0) : 0), 0)

/** 本人のリストだけ。他人・なしは 404 */
export const getOwnedList = async (
  lists: Pick<ListRepo, 'getOwned'>,
  userId: string,
  listId: string,
): Promise<List> => {
  const list = await lists.getOwned(userId, listId)
  if (!list) throw new AppError('not_found', 'list not found')
  return list
}

/** 完了していないリスト (planning / shopping)。完了済みは 409 */
export const getEditableList = async (
  lists: Pick<ListRepo, 'getOwned'>,
  userId: string,
  listId: string,
) => {
  const list = await getOwnedList(lists, userId, listId)
  if (list.status === 'finished') throw new AppError('conflict', 'list already finished')
  return list
}

/** 買い物中のリスト。それ以外は 409 */
export const getShoppingList = async (
  lists: Pick<ListRepo, 'getOwned'>,
  userId: string,
  listId: string,
) => {
  const list = await getOwnedList(lists, userId, listId)
  if (list.status !== 'shopping') throw new AppError('conflict', 'list is not in shopping')
  return list
}

/** リストの品目。なければ 404 */
export const getItemOrThrow = async (
  lists: Pick<ListRepo, 'getItem'>,
  listId: string,
  itemId: string,
) => {
  const found = await lists.getItem(listId, itemId)
  if (!found) throw new AppError('not_found', 'item not found')
  return found
}

/** 応答の形 (リスト + 品目 + 支出の合計 + 残り) */
export const toDetail = async (lists: Pick<ListRepo, 'listItems'>, list: List) => {
  const items = await lists.listItems(list.id)
  const spent = sumSpent(items)
  return { list, items, spent, remaining: list.budget - spent }
}
