import type { FormEvent } from 'react'
import { Button } from '~/components/Button'
import { Card } from '~/components/Card'
import { ScreenTitle } from '~/components/Screen'
import { formatYen, parseYen } from '../logic/yen'
import type { ListItem } from '../types'
import { Field } from './Field'
import { ItemRow } from './ItemRow'

type Props = {
  spent: number
  extras: ListItem[]
  pending: boolean
  onBack: () => void
  onFinish: (spentAmount: number) => void
}

/** 買い物終了: レジで使った金額を確認して判定へ */
export function FinishView({ spent, extras, pending, onBack, onFinish }: Props) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const n = parseYen(String(new FormData(e.currentTarget).get('spent') ?? ''))
    if (n !== null) onFinish(n)
  }
  return (
    <form onSubmit={submit} className="flex flex-col">
      <ScreenTitle>おつかれさま！</ScreenTitle>
      <Card>
        <div className="mb-1.5 text-xs font-normal text-muted">レジでいくら使った？</div>
        <Field
          name="spent"
          inputMode="numeric"
          defaultValue={formatYen(spent)}
          aria-label="使った金額"
          className="mb-0 text-[28px]"
          required
        />
      </Card>
      {extras.length > 0 ? (
        <Card>
          <div className="text-xs font-normal text-muted">リスト外で買ったもの</div>
          {extras.map((it) => (
            <ItemRow key={it.id} item={it} />
          ))}
          <div className="text-xs font-normal text-muted">
            リスト外で買ったので、不要買いとしてカウント
          </div>
        </Card>
      ) : null}
      <Button type="submit" disabled={pending}>
        判定する
      </Button>
      <Button variant="sub" small onClick={onBack}>
        買い物にもどる
      </Button>
    </form>
  )
}
