import { createApi, unwrap } from '~/lib/api'

/** GET /me (ペット名・コインなど)。型は backend の AppType から得る */
export const fetchMe = async (accessToken: string) => unwrap(await createApi(accessToken).me.$get())

/** POST /rewards/login。1 日 1 回で冪等 (付与済みなら granted: false) */
export const claimLoginReward = async (accessToken: string) =>
  unwrap(await createApi(accessToken).rewards.login.$post())

/** GET /shop/items (マスタ + 所持 + 着用) */
export const fetchShopItems = async (accessToken: string) =>
  unwrap(await createApi(accessToken).shop.items.$get())

/** POST /shop/items/:key/buy。コイン不足・所持済みは例外 */
export const buyItem = async (accessToken: string, key: string) =>
  unwrap(await createApi(accessToken).shop.items[':key'].buy.$post({ param: { key } }))

/** PATCH /shop/items/:key/equip (着る / 外す) */
export const equipItem = async (accessToken: string, key: string, equipped: boolean) =>
  unwrap(
    await createApi(accessToken).shop.items[':key'].equip.$patch({
      param: { key },
      json: { equipped },
    }),
  )

export type Me = Awaited<ReturnType<typeof fetchMe>>
export type LoginReward = Awaited<ReturnType<typeof claimLoginReward>>
export type ShopItem = Awaited<ReturnType<typeof fetchShopItems>>[number]

// ログイン報酬は、同じセッション (トークン) では 1 回だけ問い合わせる (購入後の読み直しで呼び直さない)
let rewardAskedFor: string | null = null

/** ホームに必要なものをまとめて読む。報酬を先に確定させてから、残高を読む */
export const loadHome = async (accessToken: string) => {
  const reward =
    rewardAskedFor === accessToken ? null : await claimLoginReward(accessToken).catch(() => null)
  rewardAskedFor = accessToken
  const [me, items] = await Promise.all([fetchMe(accessToken), fetchShopItems(accessToken)])
  return { me, items, reward }
}

export type ShopResult = { intent: 'buy' | 'equip'; key: string; equipped: boolean; ok: boolean }

/**
 * ショップの操作 (clientAction から呼ぶ)。form: intent = buy | equip、key、equipped、unequip (同じ slot の key を , 区切り)。
 * 買ったらそのまま着せる。同じ slot の着用中アイテムは先に外す。
 */
export const runShopAction = async (accessToken: string, form: FormData): Promise<ShopResult> => {
  const intent = form.get('intent') === 'buy' ? 'buy' : 'equip'
  const key = String(form.get('key'))
  const equipped = intent === 'buy' || form.get('equipped') === 'true'
  const unequip = String(form.get('unequip') ?? '')
    .split(',')
    .filter(Boolean)
  try {
    if (intent === 'buy') await buyItem(accessToken, key)
    if (equipped) await Promise.all(unequip.map((k) => equipItem(accessToken, k, false)))
    await equipItem(accessToken, key, equipped)
    return { intent, key, equipped, ok: true }
  } catch {
    return { intent, key, equipped, ok: false }
  }
}
