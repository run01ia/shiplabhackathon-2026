import { AppError } from '../../../shared/errors'
import type { ShopRepo } from '../repository'

/** アイテムを買う。コイン減算と所持追加は repository (rpc) が 1 回で行う */
export const buyItem =
  (d: { shop: Pick<ShopRepo, 'buy'> }) => async (userId: string, key: string) => {
    const r = await d.shop.buy(userId, key)
    if (r.ok) return { coins: r.wallet.coins }
    if (r.reason === 'item_not_found') throw new AppError('not_found', 'item not found')
    throw new AppError(
      'bad_request',
      r.reason === 'insufficient_coins' ? 'insufficient coins' : 'already owned',
    )
  }
