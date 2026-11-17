// 1 ユーザーが 1 日 (JST) に読めるレシートの回数。Claude API のコスト対策
export const DAILY_SCAN_LIMIT = 5

/** 今日あと何回読めるか (0 未満にしない) */
export const remainingScans = (usedToday: number, limit: number = DAILY_SCAN_LIMIT): number =>
  Math.max(limit - usedToday, 0)
