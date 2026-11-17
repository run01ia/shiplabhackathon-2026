import type { Db, Row } from '../../../shared/supabase'
import type { LevelPolicy, WalletRepo, WalletState } from '../repository'

// コイン・スコア・経験値は profiles の列。行 ↔ 型の変換だけで、ビジネス判定はしない
export const createSupabaseWalletRepo = (db: Db, levels: LevelPolicy): WalletRepo => {
  const toWallet = (r: Row): WalletState => {
    const level = r.level as number
    const exp = r.exp as number
    return {
      coins: r.coins as number,
      score: r.score as number,
      level,
      exp,
      growth: { ...levels.progress(exp), level, exp },
    }
  }

  const addPointsBatch: WalletRepo['addPointsBatch'] = async (userId, grants) => {
    // coins・score・exp・level の更新と履歴の追加は、rpc の 1 トランザクション。
    // レベルの規則 (しきい値、経験値になる量) は TS の domain だけが持ち、配列で渡す (SQL に式を書かない)
    const { data, error } = await db.rpc('add_points', {
      p_user_id: userId,
      p_deltas: grants.map((g) => g.delta),
      p_reasons: grants.map((g) => g.reason),
      p_exp_gains: grants.map((g) => levels.gain(g.delta)),
      p_thresholds: [...levels.thresholds],
    })
    if (error) throw error
    const wallet = toWallet(data)
    const from = data.previous_level as number
    return { ...wallet, levelUp: wallet.level > from ? { from, to: wallet.level } : null }
  }

  return {
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
    addPoints: (userId, delta, reason) => addPointsBatch(userId, [{ delta, reason }]),
    addPointsBatch,
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
  }
}
