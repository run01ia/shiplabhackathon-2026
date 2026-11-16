import { AppError } from '../../../shared/errors'
import type { ShopRepo } from '../../shop/repository'
import type { WalletRepo } from '../../wallet/repository'
import type { ProfileRepo } from '../repository'

type Deps = {
  profiles: Pick<ProfileRepo, 'get'>
  wallets: Pick<WalletRepo, 'get'>
  shop: Pick<ShopRepo, 'listItems'>
}

/** ホームに出す自分の状態 (ペット名、コイン・スコア、着用中のアイテム) */
export const getMe = (d: Deps) => async (userId: string) => {
  const [profile, wallet, items] = await Promise.all([
    d.profiles.get(userId),
    d.wallets.get(userId),
    d.shop.listItems(userId),
  ])
  if (!profile || !wallet) throw new AppError('not_found', 'profile not found')
  return {
    petName: profile.petName,
    ...wallet,
    equippedItems: items.filter((i) => i.equipped).map((i) => i.key),
  }
}
