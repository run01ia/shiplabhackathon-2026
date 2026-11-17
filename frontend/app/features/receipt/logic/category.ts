import type { Category, ReceiptItem } from '../types'

/** 分類の表示名と色 (色は styles/app.css の @theme)。並びは帯グラフの順 */
export const CATEGORY_VIEW: Record<Category, { label: string; bg: string }> = {
  food: { label: '食材', bg: 'bg-mint' },
  drink: { label: '飲み物', bg: 'bg-sun' },
  daily: { label: '日用品', bg: 'bg-gray' },
  snack: { label: 'お菓子・嗜好品', bg: 'bg-pink' },
}

export const CATEGORY_ORDER = Object.keys(CATEGORY_VIEW) as Category[]

export type CategoryShare = { category: Category; amount: number; count: number; ratio: number }

/** 分類ごとの金額と割合 (値引きの行は外す)。金額が読めないときは件数で比べる。0 件の分類は出さない */
export const summarize = (items: readonly ReceiptItem[]): CategoryShare[] => {
  const rows = CATEGORY_ORDER.map((category) => {
    const mine = items.filter((i) => i.category === category)
    return {
      category,
      count: mine.length,
      amount: mine.reduce((sum, i) => sum + Math.max(i.price, 0), 0),
    }
  }).filter((r) => r.count > 0)
  const total = rows.reduce((sum, r) => sum + r.amount, 0)
  return rows.map((r) => ({
    ...r,
    ratio: total > 0 ? r.amount / total : r.count / items.length,
  }))
}

/** 値引きは -¥20 のように出す */
export const formatYen = (n: number) => `${n < 0 ? '-' : ''}¥${Math.abs(n).toLocaleString('ja-JP')}`
