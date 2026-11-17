import { useCallback, useState } from 'react'
import { Link, useFetcher, useLoaderData } from 'react-router'
import { Button } from '~/components/Button'
import { Card } from '~/components/Card'
import { Screen, ScreenTitle } from '~/components/Screen'
import { Toast } from '~/components/Toast'
import { useCatTap } from '~/features/pet'
import {
  AskSheet,
  addExtraItem,
  BudgetCard,
  FinishView,
  fetchCurrentList,
  finishShopping,
  ItemRow,
  type ListItem,
  parseYen,
  purchaseItem,
  ResultView,
  startShopping,
} from '~/features/shopping'
import { requireAccessToken } from '~/lib/session'
import type { Route } from './+types/shopping'

// 未完了のリストがなければ null (空の案内を出す)
export async function clientLoader() {
  return fetchCurrentList(await requireAccessToken())
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const token = await requireAccessToken()
  const form = await request.formData()
  const listId = String(form.get('listId'))
  const price = parseYen(String(form.get('price') ?? '')) ?? 0
  switch (form.get('intent')) {
    case 'start':
      await startShopping(token, listId)
      return { ok: true as const }
    case 'purchase':
      await purchaseItem(token, listId, String(form.get('itemId')), price)
      return { ok: true as const }
    case 'extra':
      await addExtraItem(token, listId, {
        name: String(form.get('name')),
        price,
        isUnnecessary: true,
      })
      return { ok: true as const }
    case 'finish':
      return { result: await finishShopping(token, listId, price) }
    default:
      throw new Error('unknown intent')
  }
}

export default function Shopping() {
  const detail = useLoaderData<typeof clientLoader>()
  const fetcher = useFetcher<typeof clientAction>()
  const finisher = useFetcher<typeof clientAction>()
  const [step, setStep] = useState<'shop' | 'fin'>('shop')
  const [asking, setAsking] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const clearToast = useCallback(() => setToast(null), [])
  const { tap } = useCatTap()

  // 終了後は loader が null になるので、判定の結果を先に見る
  const result = finisher.data && 'result' in finisher.data ? finisher.data.result : null
  if (result) {
    return (
      <Screen tab={false}>
        <ResultView result={result} />
      </Screen>
    )
  }

  if (!detail) {
    return (
      <Screen tab={false} className="justify-center text-center">
        <ScreenTitle>買い物中のリストがありません</ScreenTitle>
        <Link to="/lists" className="text-ink">
          買い物リストをつくる
        </Link>
      </Screen>
    )
  }

  const { list, items, spent, remaining } = detail
  const listId = list.id
  const busy = fetcher.state !== 'idle'

  if (list.status === 'planning') {
    return (
      <Screen tab={false} className="justify-center">
        <ScreenTitle className="text-center">お店についた？</ScreenTitle>
        <Button
          variant="mint"
          disabled={busy}
          onClick={() => fetcher.submit({ intent: 'start', listId }, { method: 'post' })}
        >
          買い物スタート
        </Button>
      </Screen>
    )
  }

  // チェックはワンタップ。金額は行の中で後から入れられる
  const purchase = (item: ListItem, price: number) => {
    if (!item.isChecked) tap()
    fetcher.submit(
      { intent: 'purchase', listId, itemId: item.id, price: String(price) },
      { method: 'post' },
    )
  }

  const buyExtra = (name: string, price: number) => {
    tap()
    fetcher.submit({ intent: 'extra', listId, name, price: String(price) }, { method: 'post' })
    setAsking(false)
  }

  const finish = (spentAmount: number) => {
    tap()
    finisher.submit({ intent: 'finish', listId, price: String(spentAmount) }, { method: 'post' })
  }

  if (step === 'fin') {
    return (
      <Screen tab={false}>
        <FinishView
          spent={spent}
          extras={items.filter((it) => it.isExtra)}
          pending={finisher.state !== 'idle'}
          onBack={() => setStep('shop')}
          onFinish={finish}
        />
      </Screen>
    )
  }

  return (
    <>
      <Screen tab={false}>
        <div className="mb-2.5 flex items-center justify-between">
          <b>買い物中</b>
          <Link
            to="/home"
            className="flex min-h-11 items-center rounded-btn border-3 border-ink bg-paper px-3.5 text-sm text-ink no-underline shadow-pop"
          >
            もどる
          </Link>
        </div>
        <BudgetCard budget={list.budget} remaining={remaining} />
        <Card className="py-1">
          {items.map((it) => (
            <ItemRow key={it.id} item={it} onPurchase={purchase} />
          ))}
        </Card>
        <Button variant="sub" onClick={() => setAsking(true)}>
          リストにないものが気になる…
        </Button>
        <Button variant="mint" onClick={() => setStep('fin')}>
          買い物おわり
        </Button>
      </Screen>
      <AskSheet
        open={asking}
        onClose={() => setAsking(false)}
        onBuy={buyExtra}
        onSkip={() => {
          setAsking(false)
          setToast('がまんできた！ えらい (+5)')
          tap()
        }}
      />
      <Toast message={toast} onDone={clearToast} />
    </>
  )
}
