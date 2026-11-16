import type { WalletRepo } from '../../wallet/repository'
import type { DropPolicy, Rarity, ShopRepo } from '../repository'

/** 着せ替えマスタ (supabase の初期データと同じ) */
const ITEMS: { key: string; name: string; price: number; rarity: Rarity | null }[] = [
  { key: 'hat', name: 'ぼうし', price: 30, rarity: null },
  { key: 'ribbon', name: 'リボン', price: 40, rarity: null },
  { key: 'crown', name: 'おうかん', price: 200, rarity: null },
  { key: 'glasses', name: 'めがね', price: 60, rarity: null },
  { key: 'straw', name: 'むぎわらぼうし', price: 0, rarity: 'common' },
  { key: 'beanie', name: 'ニットぼう', price: 0, rarity: 'common' },
  { key: 'chef', name: 'コックぼう', price: 0, rarity: 'rare' },
  { key: 'wizard', name: 'まほうのぼうし', price: 0, rarity: 'epic' },
]

// コインは wallet の port 経由で読み書きする (supabase では rpc buy_item が 1 回で行う)
export const createMemoryShopRepo = (
  wallets: Pick<WalletRepo, 'get' | 'save'>,
  drops: DropPolicy,
): ShopRepo => {
  /** userId -> (itemKey -> equipped) */
  const userItems = new Map<string, Map<string, boolean>>()
  const owned = (id: string) => {
    const existing = userItems.get(id)
    if (existing) return existing
    const created = new Map<string, boolean>()
    userItems.set(id, created)
    return created
  }

  const listItems = async (id: string) => {
    const mine = owned(id)
    return ITEMS.map((i) => ({
      ...i,
      owned: mine.has(i.key),
      equipped: mine.get(i.key) ?? false,
    }))
  }

  return {
    listItems,
    buy: async (id, key) => {
      // おみやげ限定 (rarity あり) は買えない
      const item = ITEMS.find((i) => i.key === key && i.rarity === null)
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
    rollDrop: async (id) => {
      const pick = drops.pick(await listItems(id))
      if (pick) {
        owned(id).set(pick.key, false)
        return pick
      }
      const wallet = await wallets.get(id)
      if (wallet) await wallets.save(id, { ...wallet, coins: wallet.coins + drops.coins })
      return { coins: drops.coins }
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
