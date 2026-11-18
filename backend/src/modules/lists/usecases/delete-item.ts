import type { ListRepo } from '../repository'
import { getEditableList, getItemOrThrow } from './guards'

/** 品目を消す */
export const deleteItem =
  (d: { lists: ListRepo }) => async (userId: string, listId: string, itemId: string) => {
    await getEditableList(d.lists, userId, listId)
    await getItemOrThrow(d.lists, listId, itemId)
    await d.lists.deleteItem(itemId)
  }
