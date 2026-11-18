import { describe, expect, it } from 'vitest'
import { isOnList, normalizeName } from './match'

describe('normalizeName', () => {
  it('空白を除き、全角半角とカタカナ・ひらがなをそろえる', () => {
    expect(normalizeName(' 牛乳　１Ｌ ')).toBe('牛乳1l')
    expect(normalizeName('ﾃｨｯｼｭ')).toBe('てぃっしゅ')
    expect(normalizeName('ニンジン')).toBe('にんじん')
  })
})

describe('isOnList', () => {
  const list = ['にんじん', 'とうふ', '牛乳', 'ティッシュ']

  it('どちらかがもう一方を含めば、リストの品目', () => {
    expect(isOnList('牛乳 1L', list)).toBe(true)
    expect(isOnList('ティッシュ 5 箱', list)).toBe(true)
    expect(isOnList('牛乳', ['牛乳 1L'])).toBe(true)
  })

  it('ひらがなとカタカナのちがいは同じ品目', () => {
    expect(isOnList('ニンジン', list)).toBe(true)
    expect(isOnList('てぃっしゅ', list)).toBe(true)
  })

  it('リストにない品目、空のリスト、空の名前は false', () => {
    expect(isOnList('ポテトチップス', list)).toBe(false)
    expect(isOnList('にんじん', [])).toBe(false)
    expect(isOnList('にんじん', ['  '])).toBe(false)
    expect(isOnList(' ', list)).toBe(false)
  })
})
