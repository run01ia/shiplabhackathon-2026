import type { Db, Row } from '../../../shared/supabase'
import type { ListRepo } from '../repository'
import { ITEM_COLS, toItem } from './supabase-rows'

type ItemOps = Pick<
  ListRepo,
  'listItems' | 'addItem' | 'getItem' | 'updateItem' | 'deleteItem' | 'getFinishedItem'
>

/** ListRepo のうち、品目 (list_items) の操作 */
export const createSupabaseItemOps = (db: Db): ItemOps => ({
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
})
