import type { ReceiptItem } from './category'

// 配点は仮置き (#8 で確定)。変えるのはこの定数だけ。
// レシートを読むのは任意なので、マイナスは付けない (減点があると読まなくなる。REQ-012「減点よりコメント」)
export const RECEIPT_POINTS = {
  /** お菓子・嗜好品が 1 つもない */
  noSnack: 5,
  /** お菓子・嗜好品が金額の FEW_SNACK_RATIO 以下 */
  fewSnack: 3,
} as const

/** 「ひかえめ」とみなす割合 (ちょうどは含む) */
export const FEW_SNACK_RATIO = 0.2
/** 「買いすぎ」とコメントする割合 (ちょうどは含む) */
export const MANY_SNACK_RATIO = 0.5

export type Verdict = 'no_snack' | 'few_snack' | 'some_snack' | 'many_snack'

export type ReceiptJudgement = {
  /** 品目の金額の合計 (値引きの行を含む) */
  itemsTotal: number
  snackCount: number
  snackTotal: number
  /** お菓子・嗜好品の割合 (0〜1)。金額で比べ、金額が読めないときは件数で比べる */
  snackRatio: number
  verdict: Verdict
  /** 付与するポイント。なければ null */
  bonus: { label: string; points: number } | null
  /** ペットのひとこと */
  comment: string
}

const COMMENTS: Record<Verdict, string> = {
  no_snack: 'お菓子なし！ひつようなものだけ買えたね。すごい！',
  few_snack: 'お菓子はちょっとだけ。じょうずに買えたね',
  some_snack: 'お菓子もたのしみだよね。つぎは 1 つへらしてみる？',
  many_snack: 'お菓子がいっぱい…！つぎはリストにあるものから買おう',
}

const BONUS: Record<Verdict, ReceiptJudgement['bonus']> = {
  no_snack: { label: 'レシート: お菓子なし', points: RECEIPT_POINTS.noSnack },
  few_snack: { label: 'レシート: お菓子ひかえめ', points: RECEIPT_POINTS.fewSnack },
  some_snack: null,
  many_snack: null,
}

const verdictOf = (snackCount: number, ratio: number): Verdict => {
  if (snackCount === 0) return 'no_snack'
  if (ratio <= FEW_SNACK_RATIO) return 'few_snack'
  return ratio >= MANY_SNACK_RATIO ? 'many_snack' : 'some_snack'
}

/** 分類した品目から、お菓子・嗜好品の割合と、ひとこと・ボーナスを決める */
export const judgeReceipt = (items: readonly ReceiptItem[]): ReceiptJudgement => {
  const snacks = items.filter((i) => i.category === 'snack')
  // 値引きの行 (マイナス) は割合の計算から外す
  const paid = (list: readonly ReceiptItem[]) =>
    list.reduce((sum, i) => sum + Math.max(i.price, 0), 0)
  const paidTotal = paid(items)
  const snackTotal = paid(snacks)
  const byCount = items.length > 0 ? snacks.length / items.length : 0
  const snackRatio = paidTotal > 0 ? snackTotal / paidTotal : byCount
  const verdict = verdictOf(snacks.length, snackRatio)
  return {
    itemsTotal: items.reduce((sum, i) => sum + i.price, 0),
    snackCount: snacks.length,
    snackTotal,
    snackRatio,
    verdict,
    bonus: BONUS[verdict],
    comment: COMMENTS[verdict],
  }
}
