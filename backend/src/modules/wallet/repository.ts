// wallet モジュールの port。use-case (他モジュールを含む) が依存するのはこの interface だけ
export type Wallet = {
  coins: number
  score: number
  level: number
  exp: number
}

export type PointLog = { id: string; delta: number; reason: string; createdAt: string }

export interface WalletRepo {
  get(userId: string): Promise<Wallet | null>
  save(userId: string, wallet: Wallet): Promise<void>
  /** coins と score を delta だけ増減し、point_logs に 1 行追加する (coins は 0 未満にしない) */
  addPoints(userId: string, delta: number, reason: string): Promise<Wallet>
  /** 新しい順 */
  listLogs(userId: string, limit: number): Promise<PointLog[]>
}
