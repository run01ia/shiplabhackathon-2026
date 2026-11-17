import {
  checkReserve,
  type Reading,
  type ReceiptReader,
  type ReceiptRepo,
  type ScanRecord,
} from '../repository'

/** 固定の読み取り結果 (お菓子は 128 / 800 = 16% → 「ひかえめ」) */
export const SAMPLE_READING: Reading = {
  isReceipt: true,
  items: [
    { name: 'にんじん', price: 98, category: 'food' },
    { name: 'とうふ', price: 78, category: 'food' },
    { name: '牛乳 1L', price: 198, category: 'drink' },
    { name: 'ティッシュ 5 箱', price: 298, category: 'daily' },
    { name: 'ポテトチップス', price: 128, category: 'snack' },
  ],
  total: 800,
}

/** Claude API を呼ばない読み取り (DB なし・鍵なしの確認用)。どの画像にも同じ結果を返す */
export const createMemoryReceiptReader = (reading: Reading = SAMPLE_READING): ReceiptReader => ({
  read: async () => ({ ok: true, raw: reading }),
})

type Scan = { userId: string; today: string; rewarded: boolean; record: ScanRecord | null }

// interface を満たす Map ベースの実装 (DB なしのローカル確認に使う)
export const createMemoryReceiptRepo = (globalLimit: number): ReceiptRepo => {
  const scans = new Map<string, Scan>()
  const on = (userId: string, today: string) =>
    [...scans.values()].filter((s) => s.userId === userId && s.today === today)

  return {
    countOn: async (userId, today) => on(userId, today).length,
    reserve: async (userId, _listId, today, limit) => {
      const usedByAll = [...scans.values()].filter((s) => s.today === today).length
      const refusal = checkReserve(on(userId, today).length, usedByAll, limit, globalLimit)
      if (refusal) return { ok: false, reason: refusal }
      const scanId = crypto.randomUUID()
      scans.set(scanId, { userId, today, rewarded: false, record: null })
      return { ok: true, scanId }
    },
    release: async (scanId) => {
      scans.delete(scanId)
    },
    complete: async (scanId, record) => {
      const scan = scans.get(scanId)
      if (scan) scan.record = record
    },
    claimReward: async (scanId) => {
      const scan = scans.get(scanId)
      if (!scan || on(scan.userId, scan.today).some((s) => s.rewarded)) return false
      scan.rewarded = true
      return true
    },
  }
}
