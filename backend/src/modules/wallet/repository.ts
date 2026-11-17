// wallet モジュールの port。use-case (他モジュールを含む) が依存するのはこの interface だけ
export type Wallet = {
  coins: number
  score: number
  level: number
  /** 累計の経験値 (プラスのポイントで増える。減らない) */
  exp: number
}

/** ペットの育ち具合。levelExp / nextLevelExp が、ゲージに出す「次のレベルまで」の割合 */
export type Growth = {
  level: number
  exp: number
  /** 今のレベルになってから貯めた経験値 */
  levelExp: number
  /** 次のレベルに必要な経験値 (最大レベルでは 0) */
  nextLevelExp: number
}

export type LevelUp = { from: number; to: number }
export type WalletState = Wallet & { growth: Growth }
/** ポイントを足した結果。levelUp は、この付与でレベルが上がったときだけ */
export type PointsResult = WalletState & { levelUp: LevelUp | null }
export type PointGrant = { delta: number; reason: string }

/** レベルの規則 (wallet の domain)。deps.ts が infra に渡す (infra は domain を import しない) */
export type LevelPolicy = {
  /** レベル 2, 3, ... に届く累計の経験値 */
  thresholds: readonly number[]
  progress: (exp: number) => Omit<Growth, 'exp'>
  /** delta のうち経験値になる量 */
  gain: (delta: number) => number
}

export type PointLog = { id: string; delta: number; reason: string; createdAt: string }

export interface WalletRepo {
  get(userId: string): Promise<WalletState | null>
  save(userId: string, wallet: Wallet): Promise<void>
  /** coins と score を delta だけ増減し、point_logs に 1 行追加する (coins は 0 未満にしない)。プラスは経験値にもなる */
  addPoints(userId: string, delta: number, reason: string): Promise<PointsResult>
  /**
   * 複数の付与を 1 回 (1 トランザクション) で反映する。coins・score・exp・level と履歴が、まとめて変わる。
   * 空なら何も変えず、今の状態を返す
   */
  addPointsBatch(userId: string, grants: readonly PointGrant[]): Promise<PointsResult>
  /** 新しい順 */
  listLogs(userId: string, limit: number): Promise<PointLog[]>
}
