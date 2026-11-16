import { toJstDate } from './date'

/** 日次報酬: 最後に付与した JST 日付が今日でなければ、新しい日 */
export const isNewDay = (lastJstDate: string | null, now: Date): boolean =>
  lastJstDate !== toJstDate(now)

// 報酬額は仮置き。仕様確定後に調整する
export const LOGIN_BONUS_COINS = 10

export const loginBonus = (lastRewardOn: string | null, now: Date): number =>
  isNewDay(lastRewardOn, now) ? LOGIN_BONUS_COINS : 0
