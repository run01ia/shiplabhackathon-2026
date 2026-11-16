import { describe, expect, it } from 'vitest'
import { toJstDate } from './date'

describe('toJstDate', () => {
  it('UTC 15:00 以降は翌日の JST 日付になる', () => {
    expect(toJstDate(new Date('2026-11-16T14:59:59Z'))).toBe('2026-11-16')
    expect(toJstDate(new Date('2026-11-16T15:00:00Z'))).toBe('2026-11-17')
  })
})
