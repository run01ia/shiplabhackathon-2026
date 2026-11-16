import { toJstDate } from '../../../shared/domain/date'

export const LOGIN_BONUS_COINS = 20
export const NO_SHOPPING_BONUS_COINS = 30

export type RewardGrant = { reason: string; delta: number }

/** 日次報酬: 最後に付与した JST 日付が今日でなければ、新しい日 */
export const isNewDay = (lastJstDate: string | null, now: Date): boolean =>
  lastJstDate !== toJstDate(now)

export type LoginRewardState = {
  /** ログイン報酬を付与した JST 日付 */
  lastLoginRewardOn: string | null
  /** 買い物の結果判定を行った JST 日付 */
  lastShoppingJudgedOn: string | null
}

/**
 * ログイン時の報酬。1 日 1 回 (同じ日は空配列)。
 * 買い物に行かなかった日 (+30) は、今日の買い物判定がなければ付与する。
 */
export const decideLoginRewards = (s: LoginRewardState, now: Date): RewardGrant[] => {
  if (!isNewDay(s.lastLoginRewardOn, now)) return []
  const grants: RewardGrant[] = [{ reason: 'ログインボーナス', delta: LOGIN_BONUS_COINS }]
  if (s.lastShoppingJudgedOn !== toJstDate(now)) {
    grants.push({ reason: '買い物に行かなかった日', delta: NO_SHOPPING_BONUS_COINS })
  }
  return grants
}
