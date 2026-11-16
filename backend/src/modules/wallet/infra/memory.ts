import type { PointLog, Wallet, WalletRepo } from '../repository'

// interface を満たす Map ベースの実装 (DB なしのローカル確認に使う)
export const createMemoryWalletRepo = (): WalletRepo => {
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

  return {
    get: async (id) => ensure(id),
    save: async (id, w) => {
      wallets.set(id, w)
    },
    addPoints: async (id, delta, reason) => {
      const wallet = ensure(id)
      const next = {
        ...wallet,
        coins: Math.max(wallet.coins + delta, 0),
        score: wallet.score + delta,
      }
      wallets.set(id, next)
      const mine = logs.get(id) ?? []
      mine.unshift({
        id: crypto.randomUUID(),
        delta,
        reason,
        createdAt: new Date().toISOString(),
      })
      logs.set(id, mine)
      return next
    },
    listLogs: async (id, limit) => (logs.get(id) ?? []).slice(0, limit),
  }
}
