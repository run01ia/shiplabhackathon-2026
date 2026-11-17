import { createApi, unwrap } from '~/lib/api'

/** GET /pantry (家にあるもの。新しい順) */
export const fetchPantry = async (token: string) => unwrap(await createApi(token).pantry.$get())

/** POST /pantry/matches (品目名のうち、家にあるもの)。名前の比較は API が行う */
export const matchPantry = async (token: string, names: string[]) =>
  unwrap(await createApi(token).pantry.matches.$post({ json: { names } }))

/** POST /pantry/items (まとめて入れる。同じ品目は入れ直しになる) */
export const addToPantry = async (token: string, names: string[]) =>
  unwrap(await createApi(token).pantry.items.$post({ json: { names } }))

/** PATCH /pantry/items/:id (ある / 少ない) */
export const setPantryStatus = async (token: string, id: string, status: 'have' | 'low') =>
  unwrap(await createApi(token).pantry.items[':id'].$patch({ param: { id }, json: { status } }))

/** DELETE /pantry/items/:id (なくなった) */
export const removeFromPantry = async (token: string, id: string) => {
  await unwrap(await createApi(token).pantry.items[':id'].$delete({ param: { id } }))
}

/**
 * リスト画面用: 在庫の一覧と、リストの品目のうち家にあるもの。
 * 在庫はおまけの機能なので、失敗してもリスト画面は出す (空として扱う)
 */
export const fetchPantryForList = async (token: string, names: string[]) => {
  try {
    const [pantry, matched] = await Promise.all([
      fetchPantry(token),
      names.length > 0 ? matchPantry(token, names) : { matches: [] },
    ])
    return { items: pantry.items, matches: matched.matches }
  } catch (e) {
    console.error('pantry failed', e)
    return { items: [], matches: [] }
  }
}
