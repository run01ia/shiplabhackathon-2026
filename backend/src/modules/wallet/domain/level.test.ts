import { describe, expect, it } from 'vitest'
import {
  expGain,
  expToNext,
  LEVEL_THRESHOLDS,
  levelForExp,
  levelProgress,
  MAX_LEVEL,
} from './level'

describe('expToNext', () => {
  it('Lv.1 → 2 は 50、以後 25 ずつ増える', () => {
    expect([1, 2, 3, 4].map(expToNext)).toEqual([50, 75, 100, 125])
  })
})

describe('levelForExp', () => {
  it('しきい値の 1 つ手前では上がらず、ちょうどで上がる', () => {
    expect(levelForExp(0)).toBe(1)
    expect(levelForExp(49)).toBe(1)
    expect(levelForExp(50)).toBe(2)
    expect(levelForExp(124)).toBe(2)
    expect(levelForExp(125)).toBe(3)
  })

  it('一度に複数のレベルを上がる (0 → 225 で Lv.4)', () => {
    expect(levelForExp(225)).toBe(4)
  })

  it('最大レベルで止まる', () => {
    expect(LEVEL_THRESHOLDS).toHaveLength(MAX_LEVEL - 1)
    expect(levelForExp(Number.MAX_SAFE_INTEGER)).toBe(MAX_LEVEL)
  })
})

describe('levelProgress', () => {
  it('今のレベルで貯めた量と、次のレベルに必要な量を返す', () => {
    expect(levelProgress(0)).toEqual({ level: 1, levelExp: 0, nextLevelExp: 50 })
    expect(levelProgress(50)).toEqual({ level: 2, levelExp: 0, nextLevelExp: 75 })
    expect(levelProgress(140)).toEqual({ level: 3, levelExp: 15, nextLevelExp: 100 })
  })

  it('最大レベルでは次がない', () => {
    const top = LEVEL_THRESHOLDS.at(-1) ?? 0
    expect(levelProgress(top + 10)).toEqual({ level: MAX_LEVEL, levelExp: 0, nextLevelExp: 0 })
  })
})

describe('expGain', () => {
  it('プラスだけが経験値になる', () => {
    expect(expGain(30)).toBe(30)
    expect(expGain(-20)).toBe(0)
  })
})
