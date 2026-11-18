// 買い物結果の判定と配点。配点は仮置き (#8 で確定)。変えるのはこの定数だけ
export const POINTS = {
  withinBudget: 30,
  asPlanned: 10,
  noUnnecessary: 5,
  overBudget: -20,
  /** 不要購入 1 件あたり */
  unnecessary: -15,
  /** 節約: 予算をおさえた割合 10% ごと */
  savingPer10Pct: 3,
  /** 節約の上限 (予算を高めに入れて稼げないように) */
  savingMax: 15,
} as const

/**
 * 節約ボーナス。予算内で、リストの品目をすべて買えたときだけ (買わずに浮いたぶんは数えない)。
 * おさえた割合 (切り捨てで % の整数) と点数を返す。対象外は null
 */
export const savingBonus = (
  budget: number,
  spent: number,
  rate: number,
): { percent: number; points: number } | null => {
  if (budget <= 0 || spent > budget || rate < 1) return null
  const percent = Math.floor(((budget - spent) * 100) / budget)
  const points = Math.min(Math.floor(percent / 10) * POINTS.savingPer10Pct, POINTS.savingMax)
  return points > 0 ? { percent, points } : null
}

export type JudgeItem = {
  isChecked: boolean
  isExtra: boolean
  isUnnecessary: boolean
}

export type ShoppingInput = {
  budget: number
  spent: number
  items: JudgeItem[]
  /**
   * レシートを読んで判定するとき。不要買いは「レシートのリスト外の品目数」で数え、
   * 手で足したリスト外の品目 (isExtra / isUnnecessary) は数えない (二重に数えない)
   */
  receipt?: { offListCount: number; bonus: ScoreLine | null }
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

/**
 * 1 日 1 回の制限をかける。今日 2 回目以降の買い物は、マイナスだけを反映する
 * (0 円の買い物の繰り返しでコインやおみやげを集められないように。マイナスは逃げられない)
 */
export const limitToDaily = (j: ShoppingJudgement, firstToday: boolean): ShoppingJudgement => {
  if (firstToday) return j
  const breakdown = j.breakdown.filter((l) => l.points < 0)
  return { ...j, breakdown, total: breakdown.reduce((sum, l) => sum + l.points, 0) }
}

export const judgeShopping = (r: ShoppingInput): ShoppingJudgement => {
  const withinBudget = isWithinBudget(r.budget, r.spent)
  const unnecessaryCount = r.receipt
    ? r.receipt.offListCount
    : r.items.filter((i) => i.isUnnecessary).length
  const rate = completionRate(r.items)
  const hasExtra = r.receipt ? r.receipt.offListCount > 0 : r.items.some((i) => i.isExtra)
  const asPlanned = rate === 1 && !hasExtra
  const base = {
    withinBudget,
    remaining: r.budget - r.spent,
    unnecessaryCount,
    completionRate: rate,
    asPlanned,
  }

  // 何も買っていない買い物はポイントなし (作成 → 終了の繰り返しでコインを稼げないように)
  if (!r.items.some((i) => i.isChecked)) return { ...base, breakdown: [], total: 0 }

  const breakdown: ScoreLine[] = [
    withinBudget
      ? { label: '予算内', points: POINTS.withinBudget }
      : { label: '予算超過', points: POINTS.overBudget },
  ]
  const saving = savingBonus(r.budget, r.spent, rate)
  if (saving) breakdown.push({ label: `予算を ${saving.percent}% おさえた`, points: saving.points })
  if (asPlanned) breakdown.push({ label: 'リスト通り', points: POINTS.asPlanned })
  if (unnecessaryCount === 0) {
    breakdown.push({ label: '不要買いをやめた', points: POINTS.noUnnecessary })
  } else {
    breakdown.push({
      label: `不要買い ×${unnecessaryCount}`,
      points: POINTS.unnecessary * unnecessaryCount,
    })
  }
  // レシートのボーナス (お菓子なし・ひかえめ)。プラスなので limitToDaily の 1 日 1 回に従う
  if (r.receipt?.bonus) breakdown.push(r.receipt.bonus)

  return {
    ...base,
    breakdown,
    total: breakdown.reduce((sum, l) => sum + l.points, 0),
  }
}
