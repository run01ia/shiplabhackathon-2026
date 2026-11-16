// 買い物結果の判定と配点。配点は仮置き (#8 で確定)。変えるのはこの定数だけ
export const POINTS = {
  withinBudget: 30,
  asPlanned: 10,
  noUnnecessary: 5,
  overBudget: -20,
  /** 不要購入 1 件あたり */
  unnecessary: -15,
} as const

export type JudgeItem = {
  isChecked: boolean
  isExtra: boolean
  isUnnecessary: boolean
}

export type ShoppingInput = {
  budget: number
  spent: number
  items: JudgeItem[]
}

export type ScoreLine = { label: string; points: number }

export type ShoppingJudgement = {
  withinBudget: boolean
  /** 予算 - 支出。超過ならマイナス */
  remaining: number
  unnecessaryCount: number
  /** リスト消化率 (0〜1)。リストの品目 (リスト外を除く) のうち購入済みの割合 */
  completionRate: number
  /** リストの品目をすべて買い、リスト外の購入がない */
  asPlanned: boolean
  breakdown: ScoreLine[]
  total: number
}

/** 予算ちょうどは予算内 */
export const isWithinBudget = (budget: number, spent: number): boolean => spent <= budget

/** リスト消化率。リストの品目がなければ 0 */
export const completionRate = (items: JudgeItem[]): number => {
  const planned = items.filter((i) => !i.isExtra)
  if (planned.length === 0) return 0
  return planned.filter((i) => i.isChecked).length / planned.length
}

export const judgeShopping = (r: ShoppingInput): ShoppingJudgement => {
  const withinBudget = isWithinBudget(r.budget, r.spent)
  const unnecessaryCount = r.items.filter((i) => i.isUnnecessary).length
  const rate = completionRate(r.items)
  const hasExtra = r.items.some((i) => i.isExtra)
  const asPlanned = rate === 1 && !hasExtra

  const breakdown: ScoreLine[] = [
    withinBudget
      ? { label: '予算内', points: POINTS.withinBudget }
      : { label: '予算超過', points: POINTS.overBudget },
  ]
  if (asPlanned) breakdown.push({ label: 'リスト通り', points: POINTS.asPlanned })
  if (unnecessaryCount === 0) {
    breakdown.push({ label: '不要買いをやめた', points: POINTS.noUnnecessary })
  } else {
    breakdown.push({
      label: `不要買い ×${unnecessaryCount}`,
      points: POINTS.unnecessary * unnecessaryCount,
    })
  }

  return {
    withinBudget,
    remaining: r.budget - r.spent,
    unnecessaryCount,
    completionRate: rate,
    asPlanned,
    breakdown,
    total: breakdown.reduce((sum, l) => sum + l.points, 0),
  }
}
