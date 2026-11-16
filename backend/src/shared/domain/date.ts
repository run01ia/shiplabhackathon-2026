// JST の日付境界はここだけ。時刻は引数で受ける (Date.now() を直接呼ばない)
const JST_OFFSET_MS = 9 * 60 * 60 * 1000

/** Date を JST の日付 (YYYY-MM-DD) に変換する */
export const toJstDate = (date: Date): string =>
  new Date(date.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10)
