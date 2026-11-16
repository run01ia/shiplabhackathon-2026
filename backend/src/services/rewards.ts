import { decideLoginRewards, toJstDate } from '../domain'
import { ServiceError } from './errors'
import type { ServiceDeps } from './types'

export const createRewardsService = ({ repos, clock }: ServiceDeps) => ({
  /** ログイン報酬。1 日 1 回で冪等。付与した内訳を返す (付与済みなら空) */
  async claimLogin(userId: string) {
    const now = clock()
    const profile = await repos.profiles.get(userId)
    if (!profile) throw new ServiceError('not_found', 'profile not found')

    const grants = decideLoginRewards(profile, now)
    // 先に付与日を原子的に取る。同時に呼ばれても片方だけが付与できる
    const claimed =
      grants.length > 0 && (await repos.profiles.claimLoginReward(userId, toJstDate(now)))
    const applied = claimed ? grants : []

    let wallet = await repos.wallets.get(userId)
    for (const g of applied) wallet = await repos.wallets.addPoints(userId, g.delta, g.reason)
    if (!wallet) throw new ServiceError('not_found', 'profile not found')
    return {
      granted: applied.length > 0,
      rewards: applied,
      total: applied.reduce((sum, g) => sum + g.delta, 0),
      coins: wallet.coins,
      score: wallet.score,
    }
  },
})
