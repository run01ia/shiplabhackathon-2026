import { createApi, unwrap } from '~/lib/api'

/** zValidator の 400 (ok: false) を型から外してから unwrap する (実行時は unwrap が投げる) */
type Res = { ok: boolean; status: number; statusText: string; json: () => Promise<unknown> }
type OkJson<R extends Res> = Awaited<ReturnType<Exclude<R, { ok: false }>['json']>>
const unwrapOk = <R extends Res>(res: R) => unwrap(res) as Promise<OkJson<R>>

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
  unwrapOk(
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
  unwrapOk(
    await createApi(accessToken).lists[':id']['extra-items'].$post({ param: { id }, json: body }),
  )

/** POST /lists/:id/finish */
export const finishShopping = async (accessToken: string, id: string, spentAmount?: number) =>
  unwrapOk(
    await createApi(accessToken).lists[':id'].finish.$post({
      param: { id },
      json: { spentAmount },
    }),
  )
