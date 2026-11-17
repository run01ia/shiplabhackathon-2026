import type { ListRepo } from '../../lists/repository'
import type { WalletRepo } from '../../wallet/repository'
import type { Reading, ReceiptReader, ReceiptRepo } from '../repository'
import { getReceiptStatus } from './get-receipt-status'
import { scanReceipt } from './scan-receipt'

export type { ScanFailure } from './scan-receipt'

export type ReceiptUsecaseDeps = {
  receipts: ReceiptRepo
  receiptReader: ReceiptReader | null
  lists: ListRepo
  wallets: WalletRepo
  clock: () => Date
  parseReading: (raw: unknown) => Reading | null
}

/** routes.ts に渡す use-case の束。依存をここで 1 回だけ渡す */
export const createReceiptUsecases = (d: ReceiptUsecaseDeps) => ({
  getReceiptStatus: getReceiptStatus(d),
  scanReceipt: scanReceipt(d),
})
