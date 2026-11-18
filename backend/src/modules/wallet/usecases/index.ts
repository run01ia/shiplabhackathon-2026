import type { ShopRepo } from '../../shop/repository'
import type { WalletRepo } from '../repository'
import { listPointLogs } from './list-point-logs'

export type WalletUsecaseDeps = { wallets: WalletRepo; shop: Pick<ShopRepo, 'listPurchases'> }

/** routes.ts に渡す use-case の束。依存をここで 1 回だけ渡す */
export const createWalletUsecases = (d: WalletUsecaseDeps) => ({
  listPointLogs: listPointLogs(d),
})
