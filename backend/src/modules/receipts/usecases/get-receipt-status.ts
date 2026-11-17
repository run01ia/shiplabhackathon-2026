import { toJstDate } from '../../../shared/domain/date'
import { DAILY_SCAN_LIMIT, remainingScans } from '../domain/limit'
import type { ReceiptReader, ReceiptRepo } from '../repository'

type Deps = {
  receipts: Pick<ReceiptRepo, 'countOn'>
  receiptReader: ReceiptReader | null
  clock: () => Date
}

/** レシートの AI 判定が使えるか (キー未設定なら enabled: false。画面はボタンを出さない) と、今日の残り回数 */
export const getReceiptStatus = (d: Deps) => async (userId: string) => {
  if (!d.receiptReader) return { enabled: false, limit: DAILY_SCAN_LIMIT, remaining: 0 }
  const used = await d.receipts.countOn(userId, toJstDate(d.clock()))
  return { enabled: true, limit: DAILY_SCAN_LIMIT, remaining: remainingScans(used) }
}
