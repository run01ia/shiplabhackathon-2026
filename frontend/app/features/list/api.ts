import { createApi, unwrap as unwrapAny } from '~/lib/api'

type Res = { ok: boolean; status: number; statusText: string; json: () => Promise<unknown> }

/** zValidator の 400 応答 (ZodSafeParseError) を型から外して unwrap する。400 は unwrap が例外にする */
const unwrap = <R extends Res>(res: R) => {
  type Ok = Exclude<R, { status: 400 }>
  return unwrapAny(res as Ok) as Promise<Awaited<ReturnType<Ok['json']>>>
}

/** 未完了のリストを返す。なければ (404) 予算 0 で新規作成する */
export const fetchOrCreateList = async (token: string) => {
  const api = createApi(token)
  const res = await api.lists.current.$get()
  // 404 は型に出ない (onError の応答) ので number として比べる
  const status: number = res.status
  if (status === 404) return unwrap(await api.lists.$post({ json: {} }))
  return unwrap(res)
}

export const updateBudget = async (token: string, id: string, budget: number) =>
  unwrap(await createApi(token).lists[':id'].$patch({ param: { id }, json: { budget } }))

export const addItem = async (token: string, id: string, name: string) =>
  unwrap(await createApi(token).lists[':id'].items.$post({ param: { id }, json: { name } }))

export const renameItem = async (token: string, id: string, itemId: string, name: string) =>
  unwrap(
    await createApi(token).lists[':id'].items[':itemId'].$patch({
      param: { id, itemId },
      json: { name },
    }),
  )

export const deleteItem = async (token: string, id: string, itemId: string) => {
  const res = await createApi(token).lists[':id'].items[':itemId'].$delete({
    param: { id, itemId },
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`)
}

export const startShopping = async (token: string, id: string) =>
  unwrap(await createApi(token).lists[':id'].start.$post({ param: { id } }))
