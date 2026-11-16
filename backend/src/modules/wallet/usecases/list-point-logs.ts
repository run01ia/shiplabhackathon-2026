import type { WalletRepo } from '../repository'

const LIMIT = 50

/** ポイントの増減履歴 (新しい順、最大 50) */
export const listPointLogs = (d: { wallets: Pick<WalletRepo, 'listLogs'> }) => (userId: string) =>
  d.wallets.listLogs(userId, LIMIT)
