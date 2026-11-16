import { toJstDate } from '../../../shared/domain/date'

/** リストの作成・閲覧ポイント (仮の値。#8 で確定) */
export const LIST_BONUS = { delta: 10, reason: 'リストを準備した' } as const

export type ListBonus = { delta: number; reason: string }

/** JST で 1 日 1 回。最後に付与した日が今日なら null */
export const decideListBonus = (lastListRewardOn: string | null, now: Date): ListBonus | null =>
  lastListRewardOn === toJstDate(now) ? null : { ...LIST_BONUS }
