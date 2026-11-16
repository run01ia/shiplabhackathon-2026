import { useCallback, useState } from 'react'
import { type ClientActionFunctionArgs, useLoaderData } from 'react-router'
import { Screen, ScreenTitle } from '~/components/Screen'
import { Toast } from '~/components/Toast'
import {
  applyFix,
  fetchHistoryLists,
  fetchPointLogs,
  fixHistoryItem,
  type HistoryTab,
  HistoryTabs,
  PointLogList,
  parseYen,
  ShoppingHistory,
  useFixItem,
} from '~/features/history'
import { requireAccessToken } from '~/lib/session'

// ポイントと買い物は独立なので並列に取る
export async function clientLoader() {
  const token = await requireAccessToken()
  const [points, history] = await Promise.all([fetchPointLogs(token), fetchHistoryLists(token)])
  return { points, lists: history.lists }
}

// 「なおす」の保存。ポイントは再計算しない (API 側の仕様)
export async function clientAction({ request }: ClientActionFunctionArgs) {
  const token = await requireAccessToken()
  const fd = await request.formData()
  const price = parseYen(String(fd.get('price') ?? ''))
  return fixHistoryItem(token, String(fd.get('itemId')), {
    ...(price === undefined ? {} : { price }),
    isUnnecessary: fd.get('isUnnecessary') === 'true',
  })
}

export default function History() {
  const { points, lists } = useLoaderData<typeof clientLoader>()
  const [tab, setTab] = useState<HistoryTab>('points')
  const [toast, setToast] = useState<string | null>(null)
  const clearToast = useCallback(() => setToast(null), [])
  const showSaved = useCallback(() => setToast('なおしました'), [])
  const { editingId, startEdit, save, pending } = useFixItem(showSaved)

  return (
    <>
      <Screen>
        <ScreenTitle>履歴</ScreenTitle>
        <HistoryTabs value={tab} onChange={setTab} />
        {tab === 'points' ? (
          <PointLogList logs={points} />
        ) : (
          <ShoppingHistory
            lists={applyFix(lists, pending)}
            editingId={editingId}
            onEdit={startEdit}
            onSave={save}
          />
        )}
      </Screen>
      <Toast message={toast} onDone={clearToast} />
    </>
  )
}
