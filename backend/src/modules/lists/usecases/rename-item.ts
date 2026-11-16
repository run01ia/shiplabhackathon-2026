import type { ListRepo } from '../repository'
import { getEditableList, getItemOrThrow } from './guards'

/** 品目の名前を変える */
export const renameItem =
  (d: { lists: ListRepo }) =>
  async (userId: string, listId: string, itemId: string, name: string) => {
    await getEditableList(d.lists, userId, listId)
    await getItemOrThrow(d.lists, listId, itemId)
    return d.lists.updateItem(itemId, { name })
  }
