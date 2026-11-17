// レシートの品目の分類 (REQ-012)。キーは英字、画面の表示名は frontend が持つ
export const CATEGORIES = ['food', 'daily', 'drink', 'snack'] as const

/** food = 食材 / daily = 日用品 / drink = 飲み物 / snack = お菓子・嗜好品 */
export type Category = (typeof CATEGORIES)[number]

export type ReceiptItem = {
  name: string
  /** 円。値引きの行はマイナス */
  price: number
  category: Category
}
