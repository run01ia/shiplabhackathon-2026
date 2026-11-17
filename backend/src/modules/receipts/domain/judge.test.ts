import { describe, expect, it } from 'vitest'
import type { ReceiptItem } from './category'
import { judgeReceipt, RECEIPT_POINTS } from './judge'

const item = (category: ReceiptItem['category'], price: number): ReceiptItem => ({
  name: category,
  price,
  category,
})

describe('judgeReceipt', () => {
  it('お菓子・嗜好品がなければ、いちばん大きいボーナス', () => {
    const j = judgeReceipt([item('food', 300), item('daily', 200), item('drink', 100)])
    expect(j.verdict).toBe('no_snack')
    expect(j.snackRatio).toBe(0)
    expect(j.bonus?.points).toBe(RECEIPT_POINTS.noSnack)
  })

  it('お菓子が金額のちょうど 20% なら「ひかえめ」のボーナス', () => {
    const j = judgeReceipt([item('food', 800), item('snack', 200)])
    expect(j.snackRatio).toBe(0.2)
    expect(j.verdict).toBe('few_snack')
    expect(j.bonus?.points).toBe(RECEIPT_POINTS.fewSnack)
  })

  it('20% を超えたらボーナスなし。マイナスは付けない (コメントだけ)', () => {
    const j = judgeReceipt([item('food', 790), item('snack', 210)])
    expect(j.verdict).toBe('some_snack')
    expect(j.bonus).toBeNull()
  })

  it('ちょうど 50% からは「買いすぎ」のコメント。ボーナスなし', () => {
    const j = judgeReceipt([item('food', 500), item('snack', 500)])
    expect(j.verdict).toBe('many_snack')
    expect(j.bonus).toBeNull()
    expect(j.comment).not.toBe('')
  })

  it('値引きの行は割合に入れない (合計には入れる)', () => {
    const j = judgeReceipt([item('food', 800), item('snack', 200), item('food', -100)])
    expect(j.snackRatio).toBe(0.2)
    expect(j.itemsTotal).toBe(900)
  })

  it('金額が読めないとき (すべて 0 円) は件数で比べる', () => {
    const j = judgeReceipt([item('food', 0), item('snack', 0)])
    expect(j.snackRatio).toBe(0.5)
    expect(j.verdict).toBe('many_snack')
  })
})
