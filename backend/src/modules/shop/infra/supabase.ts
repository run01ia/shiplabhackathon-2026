import type { Db } from '../../../shared/supabase'
import type { BuyResult, ShopRepo } from '../repository'

type BuyFailure = Extract<BuyResult, { ok: false }>['reason']
const BUY_FAILURES: BuyFailure[] = ['item_not_found', 'already_owned', 'insufficient_coins']

export const createSupabaseShopRepo = (db: Db): ShopRepo => ({
  async listItems(userId) {
    const [items, mine] = await Promise.all([
      db.from('items').select('id, key, name, price').order('price'),
      db.from('user_items').select('item_id, equipped').eq('user_id', userId),
    ])
    if (items.error) throw items.error
    if (mine.error) throw mine.error
    const owned = new Map(mine.data.map((r) => [r.item_id as string, r.equipped as boolean]))
    return items.data.map((i) => ({
      key: i.key as string,
      name: i.name as string,
      price: i.price as number,
      owned: owned.has(i.id as string),
      equipped: owned.get(i.id as string) ?? false,
    }))
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
})
