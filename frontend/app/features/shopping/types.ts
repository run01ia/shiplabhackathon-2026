import type { fetchCurrentList, finishShopping } from './api'

// 型は API (backend の AppType) から得る
export type ListDetail = NonNullable<Awaited<ReturnType<typeof fetchCurrentList>>>
export type ListItem = ListDetail['items'][number]
export type FinishResult = Awaited<ReturnType<typeof finishShopping>>
/** おみやげ。帽子か、帽子を出せなかったときのコイン */
export type Drop = NonNullable<FinishResult['drop']>
