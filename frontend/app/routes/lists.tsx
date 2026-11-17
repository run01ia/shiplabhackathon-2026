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
  ListBonusToast,
  parseBudget,
  parseName,
  renameItem,
  startShopping,
  updateBudget,
} from '~/features/list'
import {
  addToPantry,
  fetchPantryForList,
  PantrySection,
  pantryNotices,
  parsePantryCommand,
  removeFromPantry,
  setPantryStatus,
} from '~/features/pantry'
import { requireAccessToken } from '~/lib/session'
import type { Route } from './+types/lists'

// 未完了のリストを続きから開く (なければ作る)。買い物中なら /shopping へ
export async function clientLoader() {
  const token = await requireAccessToken()
  const detail = await fetchOrCreateList(token)
  if (detail.list.status === 'shopping') throw redirect('/shopping')
  // 家の在庫 (REQ-013): 一覧と、リストの品目のうち家にあるもの
  const pantry = await fetchPantryForList(
    token,
    detail.items.map((it) => it.name),
  )
  return { ...detail, pantry }
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const [token, form] = await Promise.all([requireAccessToken(), request.formData()])
  const listId = String(form.get('listId') ?? '')
  const itemId = String(form.get('itemId') ?? '')
  const pantry = parsePantryCommand(form)
  if (pantry?.type === 'add') return addToPantry(token, [pantry.name])
  if (pantry?.type === 'status') return setPantryStatus(token, pantry.id, pantry.status)
  if (pantry?.type === 'remove') {
    await removeFromPantry(token, pantry.id)
    return { ok: true }
  }
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
  const { list, items, listBonus, pantry } = useLoaderData<typeof clientLoader>()
  const now = new Date()
  const notices = pantryNotices(pantry.matches, now)
  const starting = useNavigation().formData?.get('intent') === 'start'
  return (
    <>
      <ListBonusToast bonus={listBonus} />
      <Screen>
        <ScreenTitle>買い物リスト</ScreenTitle>
        <BudgetCard listId={list.id} budget={list.budget} />
        <PantrySection items={pantry.items} now={now} />
        <Card>
          {items.length > 0 ? (
            items.map((it) => (
              <ItemRow
                key={it.id}
                listId={list.id}
                id={it.id}
                name={it.name}
                note={notices.get(it.name)}
              />
            ))
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
    </>
  )
}
