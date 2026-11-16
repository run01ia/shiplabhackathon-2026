import type { Db, Row } from '../../../shared/supabase'
import type { ListRepo } from '../repository'
import { createSupabaseItemOps } from './supabase-items'
import { ITEM_COLS, LIST_COLS, toItem, toList } from './supabase-rows'

// リスト (lists) の操作。品目 (list_items) は supabase-items.ts (120 行を超えたので分けた)
export const createSupabaseListRepo = (db: Db): ListRepo => ({
  ...createSupabaseItemOps(db),
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
})
