import type { Db } from '../../../shared/supabase'
import type { ReceiptRepo } from '../repository'

/** Postgres の unique 違反 */
const UNIQUE_VIOLATION = '23505'

// receipt_scans は API (secret キー) だけが読み書きする。画像は保存しない
export const createSupabaseReceiptRepo = (db: Db, globalLimit: number): ReceiptRepo => ({
  async countOn(userId, today) {
    const { count, error } = await db
      .from('receipt_scans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('scanned_on', today)
    if (error) throw error
    return count ?? 0
  },
  async reserve(userId, listId, today, limit) {
    // 数える・足すは rpc の 1 トランザクション (同時に呼ばれても上限を超えない)
    const { data, error } = await db.rpc('reserve_receipt_scan', {
      p_user_id: userId,
      p_list_id: listId,
      p_today: today,
      p_limit: limit,
      p_global_limit: globalLimit,
    })
    if (error) throw error
    const { id, reason } = data as { id: string | null; reason: string | null }
    if (id) return { ok: true, scanId: id }
    // 想定外の値は、安全側 (読ませない) に倒す
    return { ok: false, reason: reason === 'global_limit' ? 'global_limit' : 'limit' }
  },
  async release(scanId) {
    const { error } = await db.from('receipt_scans').delete().eq('id', scanId)
    if (error) throw error
  },
  async complete(scanId, record) {
    const { error } = await db
      .from('receipt_scans')
      .update({ items: record.items, total: record.total, bonus: record.bonus })
      .eq('id', scanId)
    if (error) throw error
  },
  async claimReward(scanId) {
    // 1 日 1 回は、部分 unique インデックス (user_id, scanned_on) where rewarded が守る
    const { data, error } = await db
      .from('receipt_scans')
      .update({ rewarded: true })
      .eq('id', scanId)
      .eq('rewarded', false)
      .select('id')
    if (error) {
      if (error.code === UNIQUE_VIOLATION) return false
      throw error
    }
    return data.length > 0
  },
})
