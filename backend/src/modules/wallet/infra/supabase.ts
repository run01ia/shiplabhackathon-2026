import type { Db, Row } from '../../../shared/supabase'
import type { Wallet, WalletRepo } from '../repository'

const toWallet = (r: Row): Wallet => ({
  coins: r.coins as number,
  score: r.score as number,
  level: r.level as number,
  exp: r.exp as number,
})

// コイン・スコアは profiles の列。行 ↔ 型の変換だけで、ビジネス判定はしない
export const createSupabaseWalletRepo = (db: Db): WalletRepo => ({
  async get(userId) {
    const { data, error } = await db
      .from('profiles')
      .select('coins, score, level, exp')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw error
    return data ? toWallet(data) : null
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
})
