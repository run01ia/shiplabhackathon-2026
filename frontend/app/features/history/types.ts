import type { fetchHistoryLists, fetchPointLogs } from './api'

export type PointLog = Awaited<ReturnType<typeof fetchPointLogs>>[number]
export type HistoryList = Awaited<ReturnType<typeof fetchHistoryLists>>['lists'][number]
export type HistoryItem = HistoryList['items'][number]
