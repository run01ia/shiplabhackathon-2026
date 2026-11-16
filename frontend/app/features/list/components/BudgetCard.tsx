import { useState } from 'react'
import { useFetcher } from 'react-router'
import { BottomSheet } from '~/components/BottomSheet'
import { Button } from '~/components/Button'
import { Card } from '~/components/Card'
import { formatYen } from '../logic/parse'
import { fieldClass } from './fieldClass'

/** 今日の予算。タップで BottomSheet を開いて変更する */
export function BudgetCard({ listId, budget }: { listId: string; budget: number }) {
  const fetcher = useFetcher()
  const [open, setOpen] = useState(false)
  const pending = fetcher.formData?.get('budget')
  const shown = pending != null ? Number(pending) : budget

  return (
    <>
      <Card className="p-0">
        <button
          type="button"
          className="block w-full cursor-pointer border-0 bg-transparent p-3.5 text-left"
          onClick={() => setOpen(true)}
        >
          <div className="text-muted text-xs font-normal">今日の予算</div>
          <div className="flex items-center justify-between">
            <b className="text-[30px]">{formatYen(shown)}</b>
            <span className="text-muted text-xs font-normal">タップで変更</span>
          </div>
        </button>
      </Card>
      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <h3 className="mb-3 text-lg">今日の予算</h3>
        <fetcher.Form method="post" onSubmit={() => setOpen(false)}>
          <input type="hidden" name="intent" value="budget" />
          <input type="hidden" name="listId" value={listId} />
          <input
            className={`${fieldClass} mb-3`}
            name="budget"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            defaultValue={budget || ''}
            placeholder="例: 2000"
            aria-label="予算 (円)"
            required
          />
          <Button type="submit">決定</Button>
        </fetcher.Form>
      </BottomSheet>
    </>
  )
}
