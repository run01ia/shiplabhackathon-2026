import { AppError } from '../../../shared/errors'
import type { ShopRepo } from '../repository'

/** 所持しているアイテムを着ける / 外す */
export const equipItem =
  (d: { shop: Pick<ShopRepo, 'setEquipped'> }) =>
  async (userId: string, key: string, equipped: boolean) => {
    const r = await d.shop.setEquipped(userId, key, equipped)
    if (r === 'item_not_found') throw new AppError('not_found', 'item not found')
    if (r === 'not_owned') throw new AppError('bad_request', 'item not owned')
    return { key, equipped }
  }
