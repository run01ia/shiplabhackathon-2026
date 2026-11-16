import type { Db } from '../../lib/supabase'
import type { List, ListItem, ListStatus, Repositories } from '../types'

type Row = Record<string, unknown>

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
        .select('id, pet_name, last_login_reward_on')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      return {
        id: data.id as string,
        petName: data.pet_name as string,
        lastLoginRewardOn: data.last_login_reward_on as string | null,
      }
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
    // 暫定実装 (読む → 更新 → 履歴追加)。#33 (wallet-api) で置き換える
    async addPoints(userId, delta, reason) {
      const { data, error } = await db
        .from('profiles')
        .select('coins, score')
        .eq('id', userId)
        .single()
      if (error) throw error
      const upd = await db
        .from('profiles')
        .update({
          coins: Math.max(0, (data.coins as number) + delta),
          score: (data.score as number) + delta,
        })
        .eq('id', userId)
      if (upd.error) throw upd.error
      const log = await db.from('point_logs').insert({ user_id: userId, delta, reason })
      if (log.error) throw log.error
    },
  },
})
