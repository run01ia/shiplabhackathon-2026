import { AppError } from '../../../shared/errors'
import type { PantryRepo, PantryStatus } from '../repository'
import { toView } from './list-pantry'

/** 「ある / 少ない」を切り替える */
export const setPantryStatus =
  (d: { pantry: Pick<PantryRepo, 'setStatus'> }) =>
  async (userId: string, id: string, status: PantryStatus) => {
    const item = await d.pantry.setStatus(userId, id, status)
    if (!item) throw new AppError('not_found', 'pantry item not found')
    return toView(item)
  }
