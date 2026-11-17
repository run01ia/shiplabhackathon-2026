import { AppError } from '../../../shared/errors'
import type { PantryRepo } from '../repository'

/** 在庫から消す (使い切った) */
export const removeFromPantry =
  (d: { pantry: Pick<PantryRepo, 'remove'> }) => async (userId: string, id: string) => {
    if (!(await d.pantry.remove(userId, id))) {
      throw new AppError('not_found', 'pantry item not found')
    }
  }
