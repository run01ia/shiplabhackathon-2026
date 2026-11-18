import { AppError } from '../../../shared/errors'
import type { ListRepo } from '../repository'
import { grantListBonus, type ListBonusDeps, toDetail } from './guards'

/** 進行中のリスト (品目と支出の合計つき)。リストを開いたポイント (1 日 1 回) も付ける */
export const getCurrentList =
  (d: ListBonusDeps & { lists: ListRepo }) => async (userId: string) => {
    const list = await d.lists.getActive(userId)
    if (!list) throw new AppError('not_found', 'no active list')
    const [detail, listBonus] = await Promise.all([
      toDetail(d.lists, list),
      // ポイントの失敗でリストを開けなくしない
      grantListBonus(d, userId).catch((e: unknown) => {
        console.error('grantListBonus failed', e)
        return null
      }),
    ])
    return { ...detail, listBonus }
  }
