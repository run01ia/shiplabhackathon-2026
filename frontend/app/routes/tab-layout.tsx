import { Outlet, useLoaderData } from 'react-router'
import { TabBar } from '~/components/TabBar'
import { CatCompanion, CatTapProvider, fetchMe } from '~/features/pet'
import { requireAccessToken } from '~/lib/session'

// 未ログインなら /login へ。Supabase のセッションで判定する。
// 相棒の猫に着せるアイテムも読む (失敗しても画面は出す。購入・着用のあとは自動で読み直される)
export async function clientLoader() {
  const token = await requireAccessToken()
  const equippedItems = await fetchMe(token).then(
    (me) => me.equippedItems,
    () => [],
  )
  return { equippedItems }
}

export default function TabLayout() {
  const { equippedItems } = useLoaderData<typeof clientLoader>()
  return (
    <CatTapProvider>
      <Outlet />
      <CatCompanion accessories={equippedItems} />
      <TabBar />
    </CatTapProvider>
  )
}
