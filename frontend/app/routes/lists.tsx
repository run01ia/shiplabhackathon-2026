import { data, Form, redirect, useLoaderData, useNavigation } from 'react-router'
import { Button } from '~/components/Button'
import { Card } from '~/components/Card'
import { Screen, ScreenTitle } from '~/components/Screen'
import {
  AddItemForm,
  addItem,
  BudgetCard,
  deleteItem,
  fetchOrCreateList,
  ItemRow,
  parseBudget,
  parseName,
  renameItem,
  startShopping,
  updateBudget,
} from '~/features/list'
import { requireAccessToken } from '~/lib/session'
import type { Route } from './+types/lists'

// 未完了のリストを続きから開く (なければ作る)。買い物中なら /shopping へ
export async function clientLoader() {
  const detail = await fetchOrCreateList(await requireAccessToken())
  if (detail.list.status === 'shopping') throw redirect('/shopping')
  return detail
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const [token, form] = await Promise.all([requireAccessToken(), request.formData()])
  const listId = String(form.get('listId') ?? '')
  const itemId = String(form.get('itemId') ?? '')
  switch (form.get('intent')) {
    case 'budget': {
      const budget = parseBudget(form.get('budget'))
      if (budget == null) return data({ error: '予算は 0 以上の整数で入力してください' }, 400)
      return updateBudget(token, listId, budget)
    }
    case 'add': {
      const name = parseName(form.get('name'))
      if (!name) return data({ error: '品目名を入力してください' }, 400)
      return addItem(token, listId, name)
    }
    case 'rename': {
      const name = parseName(form.get('name'))
      if (!name) return data({ error: '品目名を入力してください' }, 400)
      return renameItem(token, listId, itemId, name)
    }
    case 'delete':
      await deleteItem(token, listId, itemId)
      return { ok: true }
    case 'start':
      await startShopping(token, listId)
      return redirect('/shopping')
    default:
      return data({ error: '不明な操作です' }, 400)
  }
}

export default function Lists() {
  const { list, items } = useLoaderData<typeof clientLoader>()
  const starting = useNavigation().formData?.get('intent') === 'start'
  return (
    <Screen>
      <ScreenTitle>買い物リスト</ScreenTitle>
      <BudgetCard listId={list.id} budget={list.budget} />
      <Card>
        {items.length > 0 ? (
          items.map((it) => <ItemRow key={it.id} listId={list.id} id={it.id} name={it.name} />)
        ) : (
          <p className="py-2.5 text-center text-sm">まだ品目がありません。下から追加しよう</p>
        )}
      </Card>
      <AddItemForm listId={list.id} />
      <p className="my-3 text-xs font-normal">
        スーパーの近くでアプリを開くと、自動で「買い物中」画面に切り替わります。
      </p>
      <Form method="post">
        <input type="hidden" name="intent" value="start" />
        <input type="hidden" name="listId" value={list.id} />
        <Button type="submit" disabled={starting || items.length === 0}>
          買い物スタート
        </Button>
      </Form>
    </Screen>
  )
}
