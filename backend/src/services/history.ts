import type { ServiceDeps } from './types'

const LIMIT = 50

export const createHistoryService = ({ repos }: ServiceDeps) => ({
  /** ポイントの増減履歴 (新しい順、最大 50) */
  points: (userId: string) => repos.wallets.listLogs(userId, LIMIT),
})
