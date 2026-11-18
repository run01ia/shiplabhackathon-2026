import { describe, expect, it } from 'vitest'
import { findInPantry, nameKey, toEntries } from './name'

describe('nameKey', () => {
  it('カタカナ・半角カナ・ひらがなを同じキーにする', () => {
    expect(nameKey('ギュウニュウ')).toBe('ぎゅうにゅう')
    expect(nameKey('ｷﾞｭｳﾆｭｳ')).toBe('ぎゅうにゅう')
    expect(nameKey('ぎゅうにゅう')).toBe('ぎゅうにゅう')
  })

  it('全角英数・大文字・前後や途中の空白を吸収する', () => {
    expect(nameKey('　ＡＢＣ　ヨーグルト ')).toBe('abcよーぐると')
    expect(nameKey('abc よーぐると')).toBe('abcよーぐると')
  })

  it('別の品目は別のキーのまま (漢字とかなは吸収しない)', () => {
    expect(nameKey('牛乳')).not.toBe(nameKey('豆乳'))
    expect(nameKey('卵')).not.toBe(nameKey('たまご'))
  })
})

describe('findInPantry', () => {
  const pantry = [
    { key: nameKey('牛乳'), name: '牛乳' },
    { key: nameKey('トマト'), name: 'トマト' },
  ]

  it('表記がゆれていても在庫を見つけ、ないものは返さない', () => {
    expect(findInPantry([' 牛乳', 'とまと', '卵'], pantry)).toEqual([
      { name: ' 牛乳', item: pantry[0] },
      { name: 'とまと', item: pantry[1] },
    ])
  })

  it('同じ名前は 1 回だけ返す', () => {
    expect(findInPantry(['牛乳', '牛乳'], pantry)).toHaveLength(1)
  })
})

describe('toEntries', () => {
  it('同じキーは 1 つにまとめ、空の名前は捨てる', () => {
    expect(toEntries(['トマト', ' とまと ', '　', '卵'])).toEqual([
      { name: 'とまと', key: 'とまと' },
      { name: '卵', key: '卵' },
    ])
  })
})
