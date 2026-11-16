import type { ShopRepo } from '../../shop/repository'
import type { WalletRepo } from '../../wallet/repository'
import type { ProfileRepo } from '../repository'
import { claimLoginReward } from './claim-login-reward'
import { getMe } from './get-me'

export type ProfileUsecaseDeps = {
  profiles: ProfileRepo
  wallets: WalletRepo
  shop: ShopRepo
  clock: () => Date
}

/** routes.ts に渡す use-case の束。依存をここで 1 回だけ渡す */
export const createProfileUsecases = (d: ProfileUsecaseDeps) => ({
  getMe: getMe(d),
  claimLoginReward: claimLoginReward(d),
})
