// profile モジュールの port。DB の列名 (snake_case) はここに出さない
export type Profile = {
  id: string
  petName: string
  lastLoginRewardOn: string | null
  lastListRewardOn: string | null
  lastShoppingJudgedOn: string | null
}

export interface ProfileRepo {
  get(userId: string): Promise<Profile | null>
  /** 買い物の結果判定日を today にする (「買い物に行かなかった日」の判定に使う) */
  markShoppingJudged(userId: string, today: string): Promise<void>
  /** ログイン報酬の付与日を today にする。すでに today なら false (1 日 1 回を原子的に守る) */
  claimLoginReward(userId: string, today: string): Promise<boolean>
  /** リスト作成・閲覧ポイントの付与日を today にする。すでに today なら false (原子的) */
  claimListReward(userId: string, today: string): Promise<boolean>
}
