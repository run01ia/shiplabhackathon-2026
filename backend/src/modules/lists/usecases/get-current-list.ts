import { AppError } from '../../../shared/errors'
import type { ListRepo } from '../repository'
import { toDetail } from './guards'

/** 進行中のリスト (品目と支出の合計つき) */
export const getCurrentList = (d: { lists: ListRepo }) => async (userId: string) => {
  const list = await d.lists.getActive(userId)
  if (!list) throw new AppError('not_found', 'no active list')
  return toDetail(d.lists, list)
}
