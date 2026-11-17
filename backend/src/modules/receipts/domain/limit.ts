// 1 ユーザーが 1 日 (JST) に読めるレシートの回数。Claude API のコスト対策
export const DAILY_SCAN_LIMIT = 5
// 全ユーザー合計の 1 日の上限 (既定値)。アカウントを量産しても、API のコストがここで止まる
export const DAILY_GLOBAL_SCAN_LIMIT = 200

/** 今日あと何回読めるか (0 未満にしない) */
export const remainingScans = (usedToday: number, limit: number = DAILY_SCAN_LIMIT): number =>
  Math.max(limit - usedToday, 0)

/** 環境変数 RECEIPT_DAILY_GLOBAL_LIMIT を読む。未設定・不正な値 (負、小数、文字) は既定値 */
export const parseGlobalLimit = (raw: string | undefined): number => {
  const text = raw?.trim() ?? ''
  return /^\d{1,9}$/.test(text) ? Number(text) : DAILY_GLOBAL_SCAN_LIMIT
}

export type ReserveRefusal = 'limit' | 'global_limit'

/** 1 回ぶんを確保できるか。自分の上限を先に見る (SQL の reserve_receipt_scan と同じ順) */
export const checkReserve = (
  usedByUser: number,
  usedByAll: number,
  userLimit: number,
  globalLimit: number,
): ReserveRefusal | null => {
  if (usedByUser >= userLimit) return 'limit'
  if (usedByAll >= globalLimit) return 'global_limit'
  return null
}

/**
 * AI が読めなかった理由。
 * refused / invalid_output = 応答は返った、rejected = 400 系 (壊れた画像など)、
 * unreachable = タイムアウト・接続エラー・想定外、rate_limited = 429、server_error = 5xx
 */
export type ReadFailure =
  | 'refused'
  | 'invalid_output'
  | 'rejected'
  | 'unreachable'
  | 'rate_limited'
  | 'server_error'

/**
 * 確保した 1 回ぶんを取り消してよい失敗か。API 側の都合 (429 と 5xx) だけ。
 * 400 系とタイムアウトは回数に数える (壊れた画像を送り続けて API を無制限に呼べないように)
 */
export const shouldRelease = (reason: ReadFailure): boolean =>
  reason === 'rate_limited' || reason === 'server_error'
