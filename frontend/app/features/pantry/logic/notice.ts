import type { PantryMatch } from '../types'

const DAY_MS = 24 * 60 * 60 * 1000
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** 在庫に入れてからの日数を「今日 / 昨日 / N 日前」にする (端末の日付で数える) */
export const stockedAgo = (stockedAt: string, now: Date): string => {
  const days = Math.round((startOfDay(now) - startOfDay(new Date(stockedAt))) / DAY_MS)
  if (days <= 0) return '今日'
  return days === 1 ? '昨日' : `${days} 日前`
}

/** 「家に牛乳があるよ (2 日前に入れた)」。少ないときは「少しあるよ」 */
export const pantryNotice = ({ item }: PantryMatch, now: Date): string => {
  const ago = stockedAgo(item.stockedAt, now)
  // 「今日入れた」「昨日入れた」「2 日前に入れた」
  const when = ago.endsWith('前') ? `${ago}に` : ago
  return `家に${item.name}が${item.status === 'low' ? '少し' : ''}あるよ (${when}入れた)`
}

/** リストの品目名 → 注意の文言 */
export const pantryNotices = (matches: readonly PantryMatch[], now: Date): Map<string, string> =>
  new Map(matches.map((m) => [m.name, pantryNotice(m, now)]))
