import type { Db } from '../../lib/supabase'
import type { BuyResult, List, ListItem, ListStatus, Repositories, Wallet } from '../types'

type Row = Record<string, unknown>

const toWallet = (r: Row): Wallet => ({
  coins: r.coins as number,
  score: r.score as number,
  level: r.level as number,
  exp: r.exp as number,
})

const LIST_COLS = 'id, user_id, budget, status, spent_amount, created_at, finished_at'
const ITEM_COLS = 'id, list_id, name, price, is_checked, is_extra, is_unnecessary'

const toList = (r: Row): List => ({
  id: r.id as string,
  userId: r.user_id as string,
  budget: r.budget as number,
  status: r.status as ListStatus,
  spentAmount: r.spent_amount as number | null,
  createdAt: r.created_at as string,
  finishedAt: r.finished_at as string | null,
})

const toItem = (r: Row): ListItem => ({
  id: r.id as string,
  listId: r.list_id as string,
  name: r.name as string,
  price: r.price as number | null,
  isChecked: r.is_checked as boolean,
  isExtra: r.is_extra as boolean,
  isUnnecessary: r.is_unnecessary as boolean,
})

// 行 (snake_case) ↔ 型 (camelCase) の変換だけ。ビジネス判定はしない
export const createSupabaseRepositories = (db: Db): Repositories => ({
  profiles: {
    async get(userId) {
      const { data, error } = await db
        .from('profiles')
        .select('id, pet_name, last_login_reward_on, last_shopping_judged_on')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      return {
        id: data.id as string,
        petName: data.pet_name as string,
        lastLoginRewardOn: data.last_login_reward_on as string | null,
        lastShoppingJudgedOn: data.last_shopping_judged_on as string | null,
      }
    },
    async markShoppingJudged(userId, today) {
      const { error } = await db
        .from('profiles')
        .update({ last_shopping_judged_on: today })
        .eq('id', userId)
      if (error) throw error
    },
    async claimLoginReward(userId, today) {
      // 条件付き更新なので、同時に呼ばれても 1 回だけ true になる
      const { data, error } = await db
        .from('profiles')
        .update({ last_login_reward_on: today })
        .eq('id', userId)
        .or(`last_login_reward_on.is.null,last_login_reward_on.neq.${today}`)
        .select('id')
      if (error) throw error
      return data.length > 0
    },
  },
  lists: {
    async getActive(userId) {
      const { data, error } = await db
        .from('lists')
        .select(LIST_COLS)
        .eq('user_id', userId)
        .neq('status', 'finished')
        .maybeSingle()
      if (error) throw error
      return data ? toList(data) : null
    },
    async getOwned(userId, listId) {
      const { data, error } = await db
        .from('lists')
        .select(LIST_COLS)
        .eq('id', listId)
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      return data ? toList(data) : null
    },
    async create(userId, budget, now) {
      const { data, error } = await db
        .from('lists')
        .insert({ user_id: userId, budget, created_at: now.toISOString() })
        .select(LIST_COLS)
        .single()
      if (error) throw error
      return toList(data)
    },
    async update(listId, patch) {
      const row: Row = {}
      if (patch.budget !== undefined) row.budget = patch.budget
      if (patch.status !== undefined) row.status = patch.status
      if (patch.spentAmount !== undefined) row.spent_amount = patch.spentAmount
      if (patch.finishedAt !== undefined) row.finished_at = patch.finishedAt
      const { data, error } = await db
        .from('lists')
        .update(row)
        .eq('id', listId)
        .select(LIST_COLS)
        .single()
      if (error) throw error
      return toList(data)
    },
    async listItems(listId) {
      const { data, error } = await db
        .from('list_items')
        .select(ITEM_COLS)
        .eq('list_id', listId)
        .order('created_at')
      if (error) throw error
      return (data ?? []).map(toItem)
    },
    async addItem(listId, item) {
      const { data, error } = await db
        .from('list_items')
        .insert({
          list_id: listId,
          name: item.name,
          price: item.price,
          is_checked: item.isChecked,
          is_extra: item.isExtra,
          is_unnecessary: item.isUnnecessary,
        })
        .select(ITEM_COLS)
        .single()
      if (error) throw error
      return toItem(data)
    },
    async getItem(listId, itemId) {
      const { data, error } = await db
        .from('list_items')
        .select(ITEM_COLS)
        .eq('id', itemId)
        .eq('list_id', listId)
        .maybeSingle()
      if (error) throw error
      return data ? toItem(data) : null
    },
    async updateItem(itemId, patch) {
      const row: Row = {}
      if (patch.name !== undefined) row.name = patch.name
      if (patch.price !== undefined) row.price = patch.price
      if (patch.isChecked !== undefined) row.is_checked = patch.isChecked
      if (patch.isUnnecessary !== undefined) row.is_unnecessary = patch.isUnnecessary
      const { data, error } = await db
        .from('list_items')
        .update(row)
        .eq('id', itemId)
        .select(ITEM_COLS)
        .single()
      if (error) throw error
      return toItem(data)
    },
    async deleteItem(itemId) {
      const { error } = await db.from('list_items').delete().eq('id', itemId)
      if (error) throw error
    },
    async listFinished(userId, limit) {
      const { data, error } = await db
        .from('lists')
        .select(`${LIST_COLS}, list_items(${ITEM_COLS})`)
        .eq('user_id', userId)
        .eq('status', 'finished')
        .order('finished_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []).map((row) => ({
        list: toList(row),
        items: ((row as Row).list_items as Row[]).map(toItem),
      }))
    },
    async getFinishedItem(userId, itemId) {
      const { data, error } = await db
        .from('list_items')
        .select(`${ITEM_COLS}, lists!inner(user_id, status)`)
        .eq('id', itemId)
        .eq('lists.user_id', userId)
        .eq('lists.status', 'finished')
        .maybeSingle()
      if (error) throw error
      return data ? toItem(data) : null
    },
  },
  wallets: {
    async get(userId) {
      const { data, error } = await db
        .from('profiles')
        .select('coins, score, level, exp')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      return data
        ? {
            coins: data.coins as number,
            score: data.score as number,
            level: data.level as number,
            exp: data.exp as number,
          }
        : null
    },
    async save(userId, w) {
      const { error } = await db
        .from('profiles')
        .update({ coins: w.coins, score: w.score, level: w.level, exp: w.exp })
        .eq('id', userId)
      if (error) throw error
    },
    async addPoints(userId, delta, reason) {
      const { data, error } = await db.rpc('add_points', {
        p_user_id: userId,
        p_delta: delta,
        p_reason: reason,
      })
      if (error) throw error
      return toWallet(data)
    },
    async listLogs(userId, limit) {
      const { data, error } = await db
        .from('point_logs')
        .select('id, delta, reason, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data.map((r) => ({
        id: r.id as string,
        delta: r.delta as number,
        reason: r.reason as string,
        createdAt: r.created_at as string,
      }))
    },
  },
  shop: {
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
    async buy(userId, itemKey): Promise<BuyResult> {
      // コイン減算と所持追加は rpc (Postgres 関数) の 1 トランザクション
      const { data, error } = await db.rpc('buy_item', { p_user_id: userId, p_item_key: itemKey })
      if (error) {
        const reason = ['item_not_found', 'already_owned', 'insufficient_coins'].find((r) =>
          error.message.includes(r),
        ) as Extract<BuyResult, { ok: false }>['reason'] | undefined
        if (reason) return { ok: false, reason }
        throw error
      }
      return { ok: true, wallet: toWallet(data) }
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
  },
})
