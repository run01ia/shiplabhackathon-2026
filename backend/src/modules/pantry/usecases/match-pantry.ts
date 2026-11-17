import { findInPantry } from '../domain/name'
import type { PantryRepo } from '../repository'
import { toView } from './list-pantry'

/** 買い物リストの品目名のうち、家にあるものを返す (重複買いの注意に使う) */
export const matchPantry =
  (d: { pantry: Pick<PantryRepo, 'list'> }) => async (userId: string, names: string[]) => {
    if (names.length === 0) return { matches: [] }
    const hits = findInPantry(names, await d.pantry.list(userId))
    return { matches: hits.map((h) => ({ name: h.name, item: toView(h.item) })) }
  }
