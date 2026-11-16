import type { ListRepo } from '../repository'

const HISTORY_LIMIT = 50

/** 完了したリストと品目 (新しい順、最大 50) */
export const listHistory = (d: { lists: ListRepo }) => async (userId: string) => {
  const rows = await d.lists.listFinished(userId, HISTORY_LIMIT)
  return rows.map(({ list, items }) => ({ list, items }))
}
