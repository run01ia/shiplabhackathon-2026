// receipts モジュールの port (REQ-012)。Claude API と DB は、この interface の裏に置く
import { CATEGORIES, type Category, type ReceiptItem } from './domain/category'
import type { ImageMediaType } from './domain/image'
import { checkReserve, type ReadFailure, type ReserveRefusal } from './domain/limit'

export type { Category, ImageMediaType, ReadFailure, ReceiptItem, ReserveRefusal }
// infra は domain を import できないので、ここから渡す
export { CATEGORIES, checkReserve }

/** レシートの設定 (環境変数)。全ユーザー合計の 1 日上限。未設定なら既定値 */
export type ReceiptEnv = { RECEIPT_DAILY_GLOBAL_LIMIT?: string }

/** 読み取った内容 (検証済み) */
export type Reading = {
  /** レシートの画像だったか。違えば items は空 */
  isReceipt: boolean
  items: ReceiptItem[]
  /** レシートに書かれた合計 (円)。読めなければ null */
  total: number | null
}

export type ReceiptImage = { bytes: Uint8Array; mediaType: ImageMediaType }

/**
 * 読み取りの結果。raw は AI が返した JSON で、まだ検証していない (use-case が検証する)。
 * 失敗を回数に数えるかは、domain の shouldRelease が reason から決める
 */
export type ReadResult = { ok: true; raw: unknown } | { ok: false; reason: ReadFailure }

export type ReserveResult = { ok: true; scanId: string } | { ok: false; reason: ReserveRefusal }

/** レシートの画像を読む AI。画像は保存しない */
export interface ReceiptReader {
  read(image: ReceiptImage): Promise<ReadResult>
}

export type ScanRecord = {
  items: ReceiptItem[]
  total: number | null
  bonus: number
}

/** 読み取りの回数と結果の記録 */
export interface ReceiptRepo {
  /** 今日 (JST) 読んだ回数 */
  countOn(userId: string, today: string): Promise<number>
  /**
   * 今日の回数が limit 未満で、全ユーザーの合計も上限未満なら、1 回ぶんを確保する。
   * 数える・足すを 1 回で行い、同時に呼ばれても上限を超えない (全体の上限は実装が持つ)
   */
  reserve(userId: string, listId: string, today: string, limit: number): Promise<ReserveResult>
  /** 確保した 1 回ぶんを取り消す (API 側の都合の失敗 = 429 と 5xx のときだけ) */
  release(scanId: string): Promise<void>
  /** 読み取り結果を記録する (画像は保存しない) */
  complete(scanId: string, record: ScanRecord): Promise<void>
  /** 今日のボーナスの権利を取る。今日はじめてなら true (同時に呼ばれても 1 回だけ true) */
  claimReward(scanId: string): Promise<boolean>
}
