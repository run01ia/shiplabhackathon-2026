import { type FormEvent, useState } from 'react'
import { Button } from '~/components/Button'
import { Card } from '~/components/Card'
import { ScreenTitle } from '~/components/Screen'
import { ReceiptPicker, ReceiptResult, ReceiptScanning, useReceiptScan } from '~/features/receipt'
import { formatYen, parseYen } from '../logic/yen'
import type { ListItem } from '../types'
import { Field } from './Field'
import { ItemRow } from './ItemRow'

type Props = {
  listId: string
  /** 買い物中に手で足したリスト外の品目 */
  extras: ListItem[]
  pending: boolean
  onBack: () => void
  /** scanId = 読んだレシート。手入力だけなら渡さない */
  onFinish: (spentAmount: number, scanId?: string) => void
}

/**
 * 買い物終了: レシートを読む (合計とリスト外の買い物が自動で入る) か、手で合計を入れて、判定へ。
 * レシートの機能が無効なら、手入力だけを出す
 */
export function FinishView({ listId, extras, pending, onBack, onFinish }: Props) {
  const { state, scan, reset } = useReceiptScan(listId)
  const [spent, setSpent] = useState('')
  const scanned = state.phase === 'done' ? state.result : null

  const read = async (file: File) => {
    const result = await scan(file)
    // 合計を入れる (ユーザーが直せる)
    if (result) setSpent(formatYen(result.total))
  }
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const n = parseYen(spent)
    if (n !== null) onFinish(n, scanned?.scanId)
  }

  return (
    <form onSubmit={submit} className="flex flex-col">
      <ScreenTitle>おつかれさま！</ScreenTitle>
      {state.phase === 'hidden' ? null : (
        <Card>
          {state.phase === 'reading' ? <ReceiptScanning /> : null}
          {state.phase === 'ready' ? (
            <ReceiptPicker remaining={state.remaining} error={state.error} onPick={read} />
          ) : null}
          {scanned ? (
            <>
              <ReceiptResult result={scanned} />
              <Button variant="sub" small className="mt-2.5 mb-0" onClick={reset}>
                レシートを使わない・とりなおす
              </Button>
            </>
          ) : null}
        </Card>
      )}
      <Card>
        <label htmlFor="spent" className="mb-1.5 block text-xs font-normal text-muted">
          {scanned
            ? 'レジでいくら使った？ (レシートの合計を入れたよ。直せるよ)'
            : 'レジでいくら使った？'}
        </label>
        <Field
          id="spent"
          name="spent"
          inputMode="numeric"
          placeholder="¥ 0"
          value={spent}
          onChange={(e) => setSpent(e.currentTarget.value)}
          className="mb-0 text-[28px]"
          required
        />
      </Card>
      {/* レシートで判定するときは、レシートのリスト外の品目だけを数える (手で足したぶんは二重に数えない) */}
      {extras.length > 0 && !scanned ? (
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
      <Button
        type="submit"
        variant={state.phase === 'ready' ? 'sun' : 'primary'}
        disabled={pending || state.phase === 'reading'}
      >
        判定する
      </Button>
      <Button variant="sub" small onClick={onBack}>
        買い物にもどる
      </Button>
    </form>
  )
}
