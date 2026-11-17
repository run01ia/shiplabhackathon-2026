import { toJstDate } from '../../../shared/domain/date'
import { AppError } from '../../../shared/errors'
import type { ListRepo } from '../../lists/repository'
import type { WalletRepo } from '../../wallet/repository'
import { checkImage } from '../domain/image'
import { judgeReceipt } from '../domain/judge'
import { DAILY_SCAN_LIMIT, remainingScans } from '../domain/limit'
import type { Reading, ReceiptReader, ReceiptRepo } from '../repository'

type Deps = {
  receipts: ReceiptRepo
  /** null = ANTHROPIC_API_KEY が未設定 (機能は無効) */
  receiptReader: ReceiptReader | null
  lists: Pick<ListRepo, 'getOwned' | 'listItems'>
  wallets: Pick<WalletRepo, 'addPoints'>
  clock: () => Date
  /** AI が返した JSON の検証 (zod は schemas.ts にあり、routes が渡す) */
  parseReading: (raw: unknown) => Reading | null
}

export type ScanFailure =
  | 'disabled'
  | 'too_large'
  | 'bad_image'
  | 'not_today'
  | 'limit'
  | 'busy'
  | 'unavailable'
  | 'unreadable'
  | 'not_receipt'

const fail = (reason: ScanFailure) => ({ ok: false as const, reason })

/**
 * レシートを読み、分類からペットのひとことと小さなボーナスを決める。
 * 画像は保存しない。回数は 1 日 DAILY_SCAN_LIMIT 回まで、ボーナスは 1 日 1 回 (JST)
 */
export const scanReceipt =
  (d: Deps) => async (userId: string, listId: string, bytes: Uint8Array) => {
    const reader = d.receiptReader
    if (!reader) return fail('disabled')
    const image = checkImage(bytes)
    if (!image.ok) return fail(image.reason)

    // 今日 (JST) 終えた自分の買い物のレシートだけ。買い物なしでボーナスを集められないようにする
    const today = toJstDate(d.clock())
    const list = await d.lists.getOwned(userId, listId)
    if (!list) throw new AppError('not_found', 'list not found')
    if (list.status !== 'finished' || !list.finishedAt) {
      throw new AppError('conflict', '買い物を終えてからレシートを読んでね')
    }
    if (toJstDate(new Date(list.finishedAt)) !== today) return fail('not_today')

    // 先に 1 回ぶんを確保する (AI を呼ぶ前に上限を確かめる。コスト対策)
    const scanId = await d.receipts.reserve(userId, listId, today, DAILY_SCAN_LIMIT)
    if (!scanId) return fail('limit')

    const read = await reader.read({ bytes, mediaType: image.mediaType }).catch((e: unknown) => {
      console.error('receipt reader failed', e instanceof Error ? e.name : 'unknown')
      return { ok: false, reason: 'unavailable', billed: false } as const
    })
    if (!read.ok) {
      // 料金がかからなかった失敗は、回数に数えない
      if (!read.billed) await d.receipts.release(scanId)
      return fail(
        read.reason === 'rate_limited' ? 'busy' : read.billed ? 'unreadable' : 'unavailable',
      )
    }
    const reading = d.parseReading(read.raw)
    if (!reading) return fail('unreadable')
    if (!reading.isReceipt || reading.items.length === 0) return fail('not_receipt')

    const judgement = judgeReceipt(reading.items)
    // ボーナスは、1 件以上買った買い物だけ (D28 と同じ)。1 日 1 回 (D31 と同じ)
    const bought = (await d.lists.listItems(listId)).some((i) => i.isChecked)
    const bonus = bought ? judgement.bonus : null
    // 権利を先に原子的に取る。同時に呼ばれても片方だけが付与できる
    const granted = bonus !== null && (await d.receipts.claimReward(scanId))
    if (bonus && granted) await d.wallets.addPoints(userId, bonus.points, bonus.label)
    await d.receipts.complete(scanId, {
      items: reading.items,
      total: reading.total,
      bonus: bonus && granted ? bonus.points : 0,
    })

    return {
      ok: true as const,
      result: {
        items: reading.items,
        /** レシートに書かれた合計。読めなければ品目の合計 */
        total: reading.total ?? judgement.itemsTotal,
        snackCount: judgement.snackCount,
        snackTotal: judgement.snackTotal,
        snackRatio: judgement.snackRatio,
        verdict: judgement.verdict,
        comment: judgement.comment,
        /** 付与したポイント。条件を満たさない・今日は受け取り済みなら null */
        bonus: bonus && granted ? bonus : null,
        /** ボーナスの条件は満たしたが、今日はもう受け取っていた */
        alreadyRewarded: bonus !== null && !granted,
        remaining: remainingScans(await d.receipts.countOn(userId, today)),
      },
    }
  }
