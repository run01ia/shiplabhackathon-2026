import { createApi, unwrap } from '~/lib/api'

/** GET /history/points (ポイント履歴。新しい順に最大 50) */
export const fetchPointLogs = async (accessToken: string) =>
  unwrap(await createApi(accessToken).history.points.$get())

/** GET /history/lists (完了した買い物。新しい順に最大 50) */
export const fetchHistoryLists = async (accessToken: string) =>
  unwrap(await createApi(accessToken).history.lists.$get())

/** PATCH /history/items/:itemId (購入金額と不要フラグを直す。ポイントは再計算しない) */
export const fixHistoryItem = async (
  accessToken: string,
  itemId: string,
  json: { price?: number; isUnnecessary?: boolean },
) =>
  unwrap(await createApi(accessToken).history.items[':itemId'].$patch({ param: { itemId }, json }))
