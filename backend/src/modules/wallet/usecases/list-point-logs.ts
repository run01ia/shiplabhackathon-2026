import type { ShopRepo } from '../../shop/repository'
import type { WalletRepo } from '../repository'

const LIMIT = 50

/** 履歴の 1 行。point = ポイントの増減、coin = ショップでの購入 (コインだけ減る) */
export type HistoryEntry = {
  id: string
  kind: 'point' | 'coin'
  delta: number
  reason: string
  createdAt: string
}

/** ポイントの増減とショップでの購入を、新しい順に並べる (最大 50) */
export const listPointLogs =
  (d: { wallets: Pick<WalletRepo, 'listLogs'>; shop: Pick<ShopRepo, 'listPurchases'> }) =>
  async (userId: string): Promise<HistoryEntry[]> => {
    const [logs, purchases] = await Promise.all([
      d.wallets.listLogs(userId, LIMIT),
      d.shop.listPurchases(userId, LIMIT),
    ])
    return [
      ...logs.map((l) => ({ ...l, kind: 'point' as const })),
      ...purchases.map((p) => ({
        id: p.id,
        kind: 'coin' as const,
        delta: -p.price,
        reason: `${p.name}を買った`,
        createdAt: p.createdAt,
      })),
    ]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, LIMIT)
  }
