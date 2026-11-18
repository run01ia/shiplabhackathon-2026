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

/** PATCH /lists/:id/items/:itemId/purchase。買い物中はチェックだけ (金額は入れないので 0 円で送る) */
export const purchaseItem = async (accessToken: string, id: string, itemId: string) =>
  unwrap(
    await createApi(accessToken).lists[':id'].items[':itemId'].purchase.$patch({
      param: { id, itemId },
      json: { price: 0 },
    }),
  )

/** POST /lists/:id/extra-items (リスト外。購入済み・不要買いとして追加。品名だけ) */
export const addExtraItem = async (accessToken: string, id: string, name: string) =>
  unwrap(
    await createApi(accessToken).lists[':id']['extra-items'].$post({
      param: { id },
      json: { name, price: 0, isUnnecessary: true },
    }),
  )

/** POST /lists/:id/finish。scanId = 読んだレシート (あれば、リスト外の買い物とボーナスも判定に入る) */
export const finishShopping = async (
  accessToken: string,
  id: string,
  spentAmount: number,
  scanId?: string,
) =>
  unwrap(
    await createApi(accessToken).lists[':id'].finish.$post({
      param: { id },
      json: { spentAmount, scanId },
    }),
  )
