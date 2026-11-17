import { type ChangeEvent, useRef } from 'react'
import { Button } from '~/components/Button'
import { Card } from '~/components/Card'
import { useReceiptScan } from '../hooks/useReceiptScan'
import { ReceiptResult } from './ReceiptResult'
import { ReceiptScanning } from './ReceiptScanning'

/**
 * 結果画面に置く「レシートでこたえあわせ」(REQ-012)。
 * 機能が無効 (backend に ANTHROPIC_API_KEY がない) なら何も出さない
 */
export function ReceiptCard({ listId }: { listId: string }) {
  const { state, scan } = useReceiptScan(listId)
  const inputRef = useRef<HTMLInputElement>(null)

  if (state.phase === 'hidden') return null

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // 同じ写真をもう一度選べるように空にする
    e.target.value = ''
    if (file) void scan(file)
  }

  return (
    <Card>
      <b className="block text-center">レシートで こたえあわせ</b>
      {state.phase === 'reading' ? <ReceiptScanning /> : null}
      {state.phase === 'done' ? <ReceiptResult result={state.result} /> : null}
      {state.phase === 'ready' ? (
        <>
          <p className="mt-1 mb-2.5 text-center text-xs font-normal text-muted">
            お菓子がなければ ボーナス。写真は保存しないよ
          </p>
          {state.error ? (
            <p className="mt-0 mb-2.5 text-center text-sm text-red" role="alert">
              {state.error}
            </p>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            aria-label="レシートの写真"
            onChange={onPick}
          />
          <Button
            variant="sun"
            className="mb-1"
            disabled={state.remaining <= 0}
            onClick={() => inputRef.current?.click()}
          >
            {state.error ? 'もう一度とる' : 'レシートを読む'}
          </Button>
          <p className="m-0 text-center text-xs font-normal text-muted">
            {state.remaining > 0
              ? `今日は あと ${state.remaining} 回 読めるよ`
              : '今日はもう読めないよ。また明日ね'}
          </p>
        </>
      ) : null}
    </Card>
  )
}
