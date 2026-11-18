import type { PantryRepo } from '../repository'
import { addToPantry } from './add-to-pantry'
import { listPantry } from './list-pantry'
import { matchPantry } from './match-pantry'
import { removeFromPantry } from './remove-from-pantry'
import { setPantryStatus } from './set-pantry-status'

export type PantryUsecaseDeps = { pantry: PantryRepo; clock: () => Date }

/** routes.ts に渡す use-case の束 */
export const createPantryUsecases = (d: PantryUsecaseDeps) => ({
  listPantry: listPantry(d),
  addToPantry: addToPantry(d),
  matchPantry: matchPantry(d),
  setPantryStatus: setPantryStatus(d),
  removeFromPantry: removeFromPantry(d),
})
