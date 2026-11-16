import { Outlet } from 'react-router'
import { TabBar } from '~/components/TabBar'
import { requireAccessToken } from '~/lib/session'

// 未ログインなら /login へ。Supabase のセッションで判定する
export async function clientLoader() {
  await requireAccessToken()
  return null
}

export default function TabLayout() {
  return (
    <>
      <Outlet />
      <TabBar />
    </>
  )
}
