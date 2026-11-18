import { describe, expect, it } from 'vitest'
import { decideLoginRewards } from './reward'

const day1 = new Date('2026-11-16T03:00:00Z') // JST 11-16
const day2 = new Date('2026-11-17T03:00:00Z') // JST 11-17

describe('decideLoginRewards', () => {
  it('初回はログイン +20 と買い物に行かなかった +30 を付与する', () => {
    const g = decideLoginRewards({ lastLoginRewardOn: null, lastShoppingJudgedOn: null }, day1)
    expect(g.map((x) => x.delta)).toEqual([20, 30])
  })

  it('同じ日に付与済みなら何も付与しない (冪等)', () => {
    const g = decideLoginRewards(
      { lastLoginRewardOn: '2026-11-16', lastShoppingJudgedOn: null },
      day1,
    )
    expect(g).toEqual([])
  })

  it('日付が変わったら再付与する', () => {
    const g = decideLoginRewards(
      { lastLoginRewardOn: '2026-11-16', lastShoppingJudgedOn: null },
      day2,
    )
    expect(g).toHaveLength(2)
  })

  it('今日すでに買い物の判定があれば +30 は付与しない', () => {
    const g = decideLoginRewards(
      { lastLoginRewardOn: null, lastShoppingJudgedOn: '2026-11-16' },
      day1,
    )
    expect(g.map((x) => x.delta)).toEqual([20])
  })
})
