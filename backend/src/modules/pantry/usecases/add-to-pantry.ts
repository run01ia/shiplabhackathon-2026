import { AppError } from '../../../shared/errors'
import { toEntries } from '../domain/name'
import type { PantryRepo } from '../repository'
import { toView } from './list-pantry'

/** 1 人が持てる在庫の数 (際限なく増やせないようにする) */
export const PANTRY_LIMIT = 200

type Deps = { pantry: Pick<PantryRepo, 'list' | 'upsertMany'>; clock: () => Date }

/** 在庫にまとめて入れる (買い物の結果からのワンタップと、手入力の両方)。同じ品目は入れ直しになる */
export const addToPantry = (d: Deps) => async (userId: string, names: string[]) => {
  const entries = toEntries(names)
  if (entries.length === 0) throw new AppError('bad_request', '品目名を入力してください')
  const keys = new Set((await d.pantry.list(userId)).map((p) => p.key))
  const added = entries.filter((e) => !keys.has(e.key)).length
  if (keys.size + added > PANTRY_LIMIT) {
    throw new AppError('bad_request', `家の在庫は ${PANTRY_LIMIT} 個までです`)
  }
  await d.pantry.upsertMany(userId, entries, d.clock().toISOString())
  return { items: (await d.pantry.list(userId)).map(toView) }
}
