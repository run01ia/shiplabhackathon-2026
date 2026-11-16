import { AppError } from '../../../shared/errors'
import type { ListRepo } from '../repository'
import { grantListBonus, type ListBonusDeps, toDetail } from './guards'

/** リストを作る。進行中のリストは 1 人 1 つまで。リストのポイント (1 日 1 回) も付ける */
export const createList =
  (d: ListBonusDeps & { lists: ListRepo }) => async (userId: string, budget: number) => {
    if (await d.lists.getActive(userId)) {
      throw new AppError('conflict', 'an unfinished list already exists')
    }
    const detail = await toDetail(d.lists, await d.lists.create(userId, budget, d.clock()))
    return { ...detail, listBonus: await grantListBonus(d, userId) }
  }
