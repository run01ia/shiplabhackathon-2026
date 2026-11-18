import { useLoaderData } from 'react-router'
import { Screen, ScreenTitle } from '~/components/Screen'
import { fetchPointLogs, PointLogList } from '~/features/history'
import { requireAccessToken } from '~/lib/session'

// 履歴はポイントだけ。買い物の記録 (何をいくらで買ったか) は今回のスコープ外なので画面から外した (D38)
export async function clientLoader() {
  const token = await requireAccessToken()
  return { points: await fetchPointLogs(token) }
}

export default function History() {
  const { points } = useLoaderData<typeof clientLoader>()
  return (
    <Screen>
      <ScreenTitle>ポイントの履歴</ScreenTitle>
      <PointLogList logs={points} />
    </Screen>
  )
}
