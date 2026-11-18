import type { ListRepo } from '../repository'
import { getEditableList } from './guards'

/** 品目を足す (価格は購入時に入れる) */
export const addItem =
  (d: { lists: ListRepo }) => async (userId: string, listId: string, name: string) => {
    await getEditableList(d.lists, userId, listId)
    return d.lists.addItem(listId, {
      name,
      price: null,
      isChecked: false,
      isExtra: false,
      isUnnecessary: false,
    })
  }
