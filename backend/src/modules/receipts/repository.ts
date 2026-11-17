// receipts モジュールの port (REQ-012)。Claude API と DB は、この interface の裏に置く
import { CATEGORIES, type Category, type ReceiptItem } from './domain/category'
import type { ImageMediaType } from './domain/image'

export type { Category, ImageMediaType, ReceiptItem }
// infra は domain を import できないので、ここから渡す
export { CATEGORIES }

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
 * billed = API の料金がかかった失敗。false なら回数に数えない
 */
export type ReadResult =
  | { ok: true; raw: unknown }
  | { ok: false; reason: 'refused' | 'invalid_output'; billed: true }
  | { ok: false; reason: 'rate_limited' | 'unavailable'; billed: false }

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
   * 今日の回数が limit 未満なら 1 回ぶんを確保して id を返す。上限なら null。
   * 数える・足すを 1 回で行い、同時に呼ばれても上限を超えない
   */
  reserve(userId: string, listId: string, today: string, limit: number): Promise<string | null>
  /** 確保した 1 回ぶんを取り消す (料金がかからなかった失敗のとき) */
  release(scanId: string): Promise<void>
  /** 読み取り結果を記録する (画像は保存しない) */
  complete(scanId: string, record: ScanRecord): Promise<void>
  /** 今日のボーナスの権利を取る。今日はじめてなら true (同時に呼ばれても 1 回だけ true) */
  claimReward(scanId: string): Promise<boolean>
}
