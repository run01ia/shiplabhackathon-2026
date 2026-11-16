import { describe, expect, it } from 'vitest'
import { decideListBonus } from './list-bonus'

describe('decideListBonus', () => {
  it('初回は +10 を付ける', () => {
    expect(decideListBonus(null, new Date('2026-11-16T03:00:00Z'))?.delta).toBe(10)
  })

  it('同じ JST の日は付けない (JST 23:59 = UTC 14:59)', () => {
    expect(decideListBonus('2026-11-16', new Date('2026-11-16T14:59:59Z'))).toBeNull()
  })

  it('JST の 0:00 (UTC 15:00) を過ぎたら、翌日として付ける', () => {
    expect(decideListBonus('2026-11-16', new Date('2026-11-16T15:00:00Z'))?.delta).toBe(10)
  })
})
