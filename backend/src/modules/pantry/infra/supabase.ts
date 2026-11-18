import type { Db, Row } from '../../../shared/supabase'
import type { PantryItem, PantryRepo, PantryStatus } from '../repository'

const COLUMNS = 'id, name, name_key, status, stocked_at'

const toItem = (r: Row): PantryItem => ({
  id: r.id as string,
  name: r.name as string,
  key: r.name_key as string,
  status: r.status as PantryStatus,
  stockedAt: r.stocked_at as string,
})

// secret キーは RLS を通らないので、必ず user_id で絞る
export const createSupabasePantryRepo = (db: Db): PantryRepo => ({
  async list(userId) {
    const { data, error } = await db
      .from('pantry_items')
      .select(COLUMNS)
      .eq('user_id', userId)
      .order('stocked_at', { ascending: false })
      .order('name')
    if (error) throw error
    return data.map(toItem)
  },
  async upsertMany(userId, entries, stockedAt) {
    const rows = entries.map((e) => ({
      user_id: userId,
      name: e.name,
      name_key: e.key,
      status: 'have',
      stocked_at: stockedAt,
    }))
    const { error } = await db.from('pantry_items').upsert(rows, { onConflict: 'user_id,name_key' })
    if (error) throw error
  },
  async setStatus(userId, id, status) {
    const { data, error } = await db
      .from('pantry_items')
      .update({ status })
      .eq('user_id', userId)
      .eq('id', id)
      .select(COLUMNS)
      .maybeSingle()
    if (error) throw error
    return data ? toItem(data) : null
  },
  async remove(userId, id) {
    const { data, error } = await db
      .from('pantry_items')
      .delete()
      .eq('user_id', userId)
      .eq('id', id)
      .select('id')
    if (error) throw error
    return data.length > 0
  },
})
