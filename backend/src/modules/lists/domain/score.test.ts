import { describe, expect, it } from 'vitest'
import { completionRate, isWithinBudget, judgeShopping } from './score'

const planned = (isChecked: boolean) => ({ isChecked, isExtra: false, isUnnecessary: false })

describe('isWithinBudget', () => {
  it('予算ちょうどは予算内、1 円超えたら予算超過', () => {
    expect(isWithinBudget(1000, 1000)).toBe(true)
    expect(isWithinBudget(1000, 1001)).toBe(false)
  })
})

describe('completionRate', () => {
  it('リスト外を除いた購入済みの割合', () => {
    const items = [
      planned(true),
      planned(false),
      { isChecked: true, isExtra: true, isUnnecessary: false },
    ]
    expect(completionRate(items)).toBe(0.5)
  })
})

describe('judgeShopping', () => {
  it('予算内・リスト通り・不要買いなしは +45', () => {
    const j = judgeShopping({ budget: 1000, spent: 1000, items: [planned(true), planned(true)] })
    expect(j.withinBudget).toBe(true)
    expect(j.remaining).toBe(0)
    expect(j.total).toBe(30 + 10 + 5)
  })

  it('何も買っていなければポイントなし', () => {
    expect(judgeShopping({ budget: 0, spent: 0, items: [] }).total).toBe(0)
    expect(judgeShopping({ budget: 1000, spent: 0, items: [planned(false)] }).breakdown).toEqual([])
  })

  it('予算超過 + 不要買い 2 件は -20 -30', () => {
    const extra = { isChecked: true, isExtra: true, isUnnecessary: true }
    const j = judgeShopping({ budget: 500, spent: 800, items: [planned(true), extra, extra] })
    expect(j.withinBudget).toBe(false)
    expect(j.remaining).toBe(-300)
    expect(j.unnecessaryCount).toBe(2)
    expect(j.asPlanned).toBe(false)
    expect(j.total).toBe(-20 - 30)
  })
})
