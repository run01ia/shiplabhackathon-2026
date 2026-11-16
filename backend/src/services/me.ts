import { ServiceError } from './errors'
import type { ServiceDeps } from './types'

export const createMeService = ({ repos }: ServiceDeps) => ({
  async get(userId: string) {
    const [profile, wallet, items] = await Promise.all([
      repos.profiles.get(userId),
      repos.wallets.get(userId),
      repos.shop.listItems(userId),
    ])
    if (!profile || !wallet) throw new ServiceError('not_found', 'profile not found')
    return {
      petName: profile.petName,
      ...wallet,
      equippedItems: items.filter((i) => i.equipped).map((i) => i.key),
    }
  },
})
