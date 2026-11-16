import type { ListRepo } from '../repository'
import { getEditableList, toDetail } from './guards'

/** 予算を変える (完了前だけ) */
export const updateBudget =
  (d: { lists: ListRepo }) => async (userId: string, listId: string, budget: number) => {
    await getEditableList(d.lists, userId, listId)
    return toDetail(d.lists, await d.lists.update(listId, { budget }))
  }
