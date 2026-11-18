import { toJstDate } from '../../../shared/domain/date'
import { AppError } from '../../../shared/errors'
import type { ListRepo } from '../../lists/repository'
import { checkImage } from '../domain/image'
import { judgeReceipt } from '../domain/judge'
import { DAILY_SCAN_LIMIT, remainingScans, shouldRelease } from '../domain/limit'
import type { Reading, ReceiptReader, ReceiptRepo } from '../repository'

type Deps = {
  receipts: Pick<ReceiptRepo, 'reserve' | 'release' | 'complete' | 'countOn'>
  /** null = ANTHROPIC_API_KEY が未設定 (機能は無効) */
  receiptReader: ReceiptReader | null
  lists: Pick<ListRepo, 'getOwned' | 'listItems'>
  clock: () => Date
  /** AI が返した JSON の検証 (zod は schemas.ts にあり、routes が渡す) */
  parseReading: (raw: unknown) => Reading | null
}

export type ScanFailure =
  | 'disabled'
  | 'too_large'
  | 'bad_image'
  | 'limit'
  | 'crowded'
  | 'busy'
  | 'unavailable'
  | 'unreadable'
  | 'not_receipt'

const fail = (reason: ScanFailure) => ({ ok: false as const, reason })

/**
 * 買い物中のリストのレシートを読み、品目の分類と「リストにあるか」を返す (判定の前に読む)。
 * ここではポイントを付けない。ボーナスと不要買いは、POST /lists/:id/finish に scanId を渡したときに決まる。
 * 画像は保存しない。回数は 1 日 DAILY_SCAN_LIMIT 回まで (全ユーザーの合計にも上限あり)
 */
export const scanReceipt =
  (d: Deps) => async (userId: string, listId: string, bytes: Uint8Array) => {
    const reader = d.receiptReader
    if (!reader) return fail('disabled')
    const image = checkImage(bytes)
    if (!image.ok) return fail(image.reason)

    // 買い物中の自分のリストだけ (他人のリストは 404)
    const list = await d.lists.getOwned(userId, listId)
    if (!list) throw new AppError('not_found', 'list not found')
    if (list.status !== 'shopping') {
      throw new AppError('conflict', '買い物中のリストのレシートだけ読めるよ')
    }
    // リストの品目名 (買い物中に手で足したリスト外の品目は、リストに含めない)
    const listNames = (await d.lists.listItems(listId)).filter((i) => !i.isExtra).map((i) => i.name)

    // 先に 1 回ぶんを確保する (AI を呼ぶ前に上限を確かめる。コスト対策)
    const today = toJstDate(d.clock())
    const reserved = await d.receipts.reserve(userId, listId, today, DAILY_SCAN_LIMIT)
    // crowded = 全ユーザー合計の 1 日上限に達した
    if (!reserved.ok) return fail(reserved.reason === 'global_limit' ? 'crowded' : 'limit')
    const { scanId } = reserved

    const read = await reader
      .read({ bytes, mediaType: image.mediaType }, listNames)
      .catch((e: unknown) => {
        console.error('receipt reader failed', e instanceof Error ? e.name : 'unknown')
        // 想定外の失敗は回数に数える (取り消すのは 429 と 5xx だけ)
        return { ok: false, reason: 'unreachable' } as const
      })
    if (!read.ok) {
      // API 側の都合 (429 / 5xx) だけ、回数に数えない。400 系やタイムアウトは数える
      if (shouldRelease(read.reason)) await d.receipts.release(scanId)
      if (read.reason === 'rate_limited') return fail('busy')
      const down = read.reason === 'server_error' || read.reason === 'unreachable'
      return fail(down ? 'unavailable' : 'unreadable')
    }
    const reading = d.parseReading(read.raw)
    if (!reading) return fail('unreadable')
    if (!reading.isReceipt || reading.items.length === 0) return fail('not_receipt')

    // 品目を記録した読み取りだけが、判定 (finish) に使える
    await d.receipts.complete(scanId, { items: reading.items, total: reading.total })
    const judgement = judgeReceipt(reading.items)

    return {
      ok: true as const,
      result: {
        /** 判定 (POST /lists/:id/finish) に渡す */
        scanId,
        items: reading.items,
        /** レシートに書かれた合計。読めなければ品目の合計 */
        total: reading.total ?? Math.max(judgement.itemsTotal, 0),
        /** リスト外の品目数 (判定で不要買いとして数える) */
        offListCount: reading.items.filter((i) => !i.onList).length,
        snackCount: judgement.snackCount,
        snackTotal: judgement.snackTotal,
        snackRatio: judgement.snackRatio,
        verdict: judgement.verdict,
        comment: judgement.comment,
        /** 判定で付く見込みのボーナス (ここでは付けない。プラスは 1 日 1 回)。なければ null */
        bonus: judgement.bonus,
        remaining: remainingScans(await d.receipts.countOn(userId, today)),
      },
    }
  }
