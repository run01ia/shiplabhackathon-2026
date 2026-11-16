import { AppError } from '../../../shared/errors'
import type { ListRepo } from '../repository'

type Patch = { price?: number; isUnnecessary?: boolean }

/** 完了後の修正。ポイントは再計算しない (MVP) */
export const fixHistoryItem =
  (d: { lists: ListRepo }) => async (userId: string, itemId: string, patch: Patch) => {
    const found = await d.lists.getFinishedItem(userId, itemId)
    if (!found) throw new AppError('not_found', 'item not found')
    return d.lists.updateItem(itemId, patch)
  }
