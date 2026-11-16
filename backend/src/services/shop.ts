import { ServiceError } from './errors'
import type { ServiceDeps } from './types'

export const createShopService = ({ repos }: ServiceDeps) => ({
  list: (userId: string) => repos.shop.listItems(userId),

  async buy(userId: string, key: string) {
    const r = await repos.shop.buy(userId, key)
    if (r.ok) return { coins: r.wallet.coins }
    if (r.reason === 'item_not_found') throw new ServiceError('not_found', 'item not found')
    throw new ServiceError(
      'bad_request',
      r.reason === 'insufficient_coins' ? 'insufficient coins' : 'already owned',
    )
  },

  async equip(userId: string, key: string, equipped: boolean) {
    const r = await repos.shop.setEquipped(userId, key, equipped)
    if (r === 'item_not_found') throw new ServiceError('not_found', 'item not found')
    if (r === 'not_owned') throw new ServiceError('bad_request', 'item not owned')
    return { key, equipped }
  },
})
