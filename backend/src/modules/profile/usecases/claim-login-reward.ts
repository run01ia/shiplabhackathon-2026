import { toJstDate } from '../../../shared/domain/date'
import { AppError } from '../../../shared/errors'
import type { WalletRepo } from '../../wallet/repository'
import { decideLoginRewards } from '../domain/reward'
import type { ProfileRepo } from '../repository'

type Deps = {
  profiles: Pick<ProfileRepo, 'get' | 'claimLoginReward'>
  wallets: Pick<WalletRepo, 'addPointsBatch'>
  clock: () => Date
}

/** ログイン報酬。1 日 1 回で冪等。付与した内訳を返す (付与済みなら空) */
export const claimLoginReward = (d: Deps) => async (userId: string) => {
  const now = d.clock()
  const profile = await d.profiles.get(userId)
  if (!profile) throw new AppError('not_found', 'profile not found')

  const grants = decideLoginRewards(profile, now)
  // 先に付与日を原子的に取る。同時に呼ばれても片方だけが付与できる
  const claimed = grants.length > 0 && (await d.profiles.claimLoginReward(userId, toJstDate(now)))
  const applied = claimed ? grants : []

  // 内訳をまとめて 1 回で付ける (空なら今の状態が返る)
  const wallet = await d.wallets.addPointsBatch(userId, applied)
  return {
    granted: applied.length > 0,
    rewards: applied,
    total: applied.reduce((sum, g) => sum + g.delta, 0),
    coins: wallet.coins,
    score: wallet.score,
    growth: wallet.growth,
    levelUp: wallet.levelUp,
  }
}
