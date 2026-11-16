import { AppError } from '../../../shared/errors'
import type { ListRepo } from '../repository'
import { getOwnedList, toDetail } from './guards'

/** 買い物を始める (planning → shopping) */
export const startShopping = (d: { lists: ListRepo }) => async (userId: string, listId: string) => {
  const list = await getOwnedList(d.lists, userId, listId)
  if (list.status !== 'planning') throw new AppError('conflict', 'list already started')
  return toDetail(d.lists, await d.lists.update(listId, { status: 'shopping' }))
}
