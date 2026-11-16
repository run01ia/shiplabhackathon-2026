import { createApi, unwrap } from '~/lib/api'

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
  await unwrap(
    await createApi(token).lists[':id'].items[':itemId'].$delete({ param: { id, itemId } }),
  )
}

export const startShopping = async (token: string, id: string) =>
  unwrap(await createApi(token).lists[':id'].start.$post({ param: { id } }))
