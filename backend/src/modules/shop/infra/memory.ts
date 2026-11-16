import type { WalletRepo } from '../../wallet/repository'
import type { ShopRepo } from '../repository'

/** 着せ替えマスタ (supabase の初期データと同じ) */
const ITEMS = [
  { key: 'hat', name: 'ぼうし', price: 30 },
  { key: 'ribbon', name: 'リボン', price: 40 },
  { key: 'crown', name: 'おうかん', price: 200 },
  { key: 'glasses', name: 'めがね', price: 60 },
]

// コインは wallet の port 経由で読み書きする (supabase では rpc buy_item が 1 回で行う)
export const createMemoryShopRepo = (wallets: Pick<WalletRepo, 'get' | 'save'>): ShopRepo => {
  /** userId -> (itemKey -> equipped) */
  const userItems = new Map<string, Map<string, boolean>>()
  const owned = (id: string) => {
    const existing = userItems.get(id)
    if (existing) return existing
    const created = new Map<string, boolean>()
    userItems.set(id, created)
    return created
  }

  return {
    listItems: async (id) => {
      const mine = owned(id)
      return ITEMS.map((i) => ({
        ...i,
        owned: mine.has(i.key),
        equipped: mine.get(i.key) ?? false,
      }))
    },
    buy: async (id, key) => {
      const item = ITEMS.find((i) => i.key === key)
      if (!item) return { ok: false, reason: 'item_not_found' }
      const mine = owned(id)
      if (mine.has(key)) return { ok: false, reason: 'already_owned' }
      const wallet = await wallets.get(id)
      if (!wallet || wallet.coins < item.price) return { ok: false, reason: 'insufficient_coins' }
      const next = { ...wallet, coins: wallet.coins - item.price }
      await wallets.save(id, next)
      mine.set(key, false)
      return { ok: true, wallet: next }
    },
    setEquipped: async (id, key, equipped) => {
      if (!ITEMS.some((i) => i.key === key)) return 'item_not_found'
      const mine = owned(id)
      if (!mine.has(key)) return 'not_owned'
      mine.set(key, equipped)
      return 'ok'
    },
  }
}
