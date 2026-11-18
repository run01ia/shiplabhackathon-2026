import type { Db } from '../../../shared/supabase'
import type { BuyResult, DropPolicy, Rarity, ShopItem, ShopRepo } from '../repository'

type BuyFailure = Extract<BuyResult, { ok: false }>['reason']
const BUY_FAILURES: BuyFailure[] = ['item_not_found', 'already_owned', 'insufficient_coins']

const listItems = async (db: Db, userId: string): Promise<ShopItem[]> => {
  const [items, mine] = await Promise.all([
    db.from('items').select('id, key, name, price, rarity').order('price'),
    db.from('user_items').select('item_id, equipped').eq('user_id', userId),
  ])
  if (items.error) throw items.error
  if (mine.error) throw mine.error
  const owned = new Map(mine.data.map((r) => [r.item_id as string, r.equipped as boolean]))
  return items.data.map((i) => ({
    key: i.key as string,
    name: i.name as string,
    price: i.price as number,
    rarity: i.rarity as Rarity | null,
    owned: owned.has(i.id as string),
    equipped: owned.get(i.id as string) ?? false,
  }))
}

export const createSupabaseShopRepo = (db: Db, drops: DropPolicy): ShopRepo => ({
  listItems: (userId) => listItems(db, userId),
  async rollDrop(userId) {
    const pick = drops.pick(await listItems(db, userId))
    // 所持追加 (またはコイン加算) は rpc の 1 トランザクション。同時に同じ帽子が当たったら、コインになる
    const { data, error } = await db.rpc('grant_drop', {
      p_user_id: userId,
      p_item_key: pick?.key ?? null,
      p_coins: drops.coins,
    })
    if (error) throw error
    return pick && data === 'item' ? pick : { coins: drops.coins }
  },
  async buy(userId, itemKey) {
    // コイン減算と所持追加は rpc (Postgres 関数) の 1 トランザクション
    const { data, error } = await db.rpc('buy_item', { p_user_id: userId, p_item_key: itemKey })
    if (error) {
      const reason = BUY_FAILURES.find((r) => error.message.includes(r))
      if (reason) return { ok: false, reason }
      throw error
    }
    // rpc は更新後の profiles の列を返す (wallet の infra は import しないので、ここで変換する)
    return {
      ok: true,
      wallet: {
        coins: data.coins as number,
        score: data.score as number,
        level: data.level as number,
        exp: data.exp as number,
      },
    }
  },
  async setEquipped(userId, itemKey, equipped) {
    const item = await db.from('items').select('id').eq('key', itemKey).maybeSingle()
    if (item.error) throw item.error
    if (!item.data) return 'item_not_found'
    const { data, error } = await db
      .from('user_items')
      .update({ equipped })
      .eq('user_id', userId)
      .eq('item_id', item.data.id)
      .select('id')
    if (error) throw error
    return data.length > 0 ? 'ok' : 'not_owned'
  },
  async listPurchases(userId, limit) {
    // rarity が null のアイテムだけがショップで買える (おみやげは無料なので除く)
    const { data, error } = await db
      .from('user_items')
      .select('id, created_at, items!inner(name, price, rarity)')
      .eq('user_id', userId)
      .is('items.rarity', null)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data.map((r) => {
      const item = r.items as unknown as { name: string; price: number }
      return {
        id: r.id as string,
        name: item.name,
        price: item.price,
        createdAt: r.created_at as string,
      }
    })
  },
})
