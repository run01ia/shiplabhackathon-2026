import type { LevelPolicy, PointLog, Wallet, WalletRepo, WalletState } from '../repository'

// interface を満たす Map ベースの実装 (DB なしのローカル確認に使う)
export const createMemoryWalletRepo = (levels: LevelPolicy): WalletRepo => {
  const wallets = new Map<string, Wallet>()
  const logs = new Map<string, PointLog[]>()
  // supabase ではサインアップ時のトリガーで作られる行を、初回アクセスで作る
  const ensure = (id: string): Wallet => {
    const existing = wallets.get(id)
    if (existing) return existing
    const created = { coins: 0, score: 0, level: 1, exp: 0 }
    wallets.set(id, created)
    return created
  }
  const withGrowth = (w: Wallet): WalletState => ({
    ...w,
    growth: { ...levels.progress(w.exp), level: w.level, exp: w.exp },
  })

  const addPointsBatch: WalletRepo['addPointsBatch'] = async (id, grants) => {
    const before = ensure(id)
    const next = { ...before }
    const mine = logs.get(id) ?? []
    for (const { delta, reason } of grants) {
      next.coins = Math.max(next.coins + delta, 0)
      next.score += delta
      next.exp += Math.max(levels.gain(delta), 0)
      mine.unshift({ id: crypto.randomUUID(), delta, reason, createdAt: new Date().toISOString() })
    }
    // supabase の rpc と同じ: レベルは下げない
    next.level = Math.max(before.level, levels.progress(next.exp).level)
    wallets.set(id, next)
    logs.set(id, mine)
    const levelUp = next.level > before.level ? { from: before.level, to: next.level } : null
    return { ...withGrowth(next), levelUp }
  }

  return {
    get: async (id) => withGrowth(ensure(id)),
    save: async (id, { coins, score, level, exp }) => {
      wallets.set(id, { coins, score, level, exp })
    },
    addPoints: (id, delta, reason) => addPointsBatch(id, [{ delta, reason }]),
    addPointsBatch,
    listLogs: async (id, limit) => (logs.get(id) ?? []).slice(0, limit),
  }
}
