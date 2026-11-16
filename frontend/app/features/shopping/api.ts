import { createApi, unwrap } from '~/lib/api'

/** GET /lists/current。未完了のリストがなければ null */
export const fetchCurrentList = async (accessToken: string) => {
  const res = await createApi(accessToken).lists.current.$get()
  // 404 は onError の応答なので型に出ない。number に広げて比べる
  if ((res.status as number) === 404) return null
  return unwrap(res)
}

/** POST /lists/:id/start (planning → shopping) */
export const startShopping = async (accessToken: string, id: string) =>
  unwrap(await createApi(accessToken).lists[':id'].start.$post({ param: { id } }))

/** PATCH /lists/:id/items/:itemId/purchase */
export const purchaseItem = async (
  accessToken: string,
  id: string,
  itemId: string,
  price: number,
) =>
  unwrap(
    await createApi(accessToken).lists[':id'].items[':itemId'].purchase.$patch({
      param: { id, itemId },
      json: { price },
    }),
  )

/** POST /lists/:id/extra-items (リスト外。購入済みで追加) */
export const addExtraItem = async (
  accessToken: string,
  id: string,
  body: { name: string; price: number; isUnnecessary: boolean },
) =>
  unwrap(
    await createApi(accessToken).lists[':id']['extra-items'].$post({ param: { id }, json: body }),
  )

/** POST /lists/:id/finish */
export const finishShopping = async (accessToken: string, id: string, spentAmount?: number) =>
  unwrap(
    await createApi(accessToken).lists[':id'].finish.$post({
      param: { id },
      json: { spentAmount },
    }),
  )
