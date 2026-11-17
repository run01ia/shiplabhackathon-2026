import type { scanReceipt } from './api'

// 型は API (backend の AppType) から得る
export type ScanResult = Awaited<ReturnType<typeof scanReceipt>>
export type ReceiptItem = ScanResult['items'][number]
export type Category = ReceiptItem['category']
