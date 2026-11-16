import { AppError } from '../../../shared/errors'
import type { ListRepo } from '../repository'
import { toDetail } from './guards'

/** リストを作る。進行中のリストは 1 人 1 つまで */
export const createList =
  (d: { lists: ListRepo; clock: () => Date }) => async (userId: string, budget: number) => {
    if (await d.lists.getActive(userId)) {
      throw new AppError('conflict', 'an unfinished list already exists')
    }
    return toDetail(d.lists, await d.lists.create(userId, budget, d.clock()))
  }
