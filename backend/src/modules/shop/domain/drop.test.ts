import { describe, expect, it } from 'vitest'
import { type DropCandidate, pickDrop, rollRarity } from './drop'

const items = (owned: string[] = []): DropCandidate[] =>
  [
    { key: 'hat', name: 'ぼうし', rarity: null },
    { key: 'straw', name: 'むぎわらぼうし', rarity: 'common' as const },
    { key: 'beanie', name: 'ニットぼう', rarity: 'common' as const },
    { key: 'chef', name: 'コックぼう', rarity: 'rare' as const },
    { key: 'wizard', name: 'まほうのぼうし', rarity: 'epic' as const },
  ].map((i) => ({ ...i, owned: owned.includes(i.key) }))

/** 決めた値を順に返す乱数 */
const seq = (...values: number[]) => {
  let i = 0
  return () => values[i++] ?? 0
}

describe('rollRarity', () => {
  it('70 / 25 / 5 の境界', () => {
    expect(rollRarity(0)).toBe('common')
    expect(rollRarity(0.6999)).toBe('common')
    expect(rollRarity(0.7)).toBe('rare')
    expect(rollRarity(0.9499)).toBe('rare')
    expect(rollRarity(0.95)).toBe('epic')
    expect(rollRarity(0.9999)).toBe('epic')
  })
})

describe('pickDrop', () => {
  it('レア度の中から、持っていない帽子を選ぶ', () => {
    expect(pickDrop(items(), seq(0, 0))?.key).toBe('straw')
    expect(pickDrop(items(), seq(0.6999, 0.9999))?.key).toBe('beanie')
    expect(pickDrop(items(['straw']), seq(0, 0))?.key).toBe('beanie')
    expect(pickDrop(items(), seq(0.7, 0))).toEqual({
      key: 'chef',
      name: 'コックぼう',
      rarity: 'rare',
    })
    expect(pickDrop(items(), seq(0.95, 0))?.key).toBe('wizard')
  })

  it('そのレア度を全部持っていたら、下のレア度へ', () => {
    expect(pickDrop(items(['wizard']), seq(0.95, 0))?.key).toBe('chef')
    expect(pickDrop(items(['wizard', 'chef']), seq(0.95, 0.5))?.key).toBe('beanie')
  })

  it('下にもなければ null (上のレア度には上げない)。全部所持も null', () => {
    expect(pickDrop(items(['straw', 'beanie']), seq(0, 0))).toBeNull()
    expect(pickDrop(items(['straw', 'beanie', 'chef', 'wizard']), seq(0.95, 0))).toBeNull()
  })

  it('ショップのアイテム (rarity が null) は出ない', () => {
    expect(
      pickDrop([{ key: 'hat', name: 'ぼうし', rarity: null, owned: false }], seq(0, 0)),
    ).toBeNull()
  })
})
