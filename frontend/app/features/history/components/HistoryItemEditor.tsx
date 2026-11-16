import { type FormEvent, useState } from 'react'
import { Button } from '~/components/Button'
import { parseYen } from '../logic/format'
import type { HistoryItem } from '../types'

export type ItemFix = { itemId: string; price?: number; isUnnecessary: boolean }

type Props = { item: HistoryItem; onSave: (fix: ItemFix) => void }

/** 品目 1 行 (編集)。購入金額と不要フラグを直して保存する */
export function HistoryItemEditor({ item, onSave }: Props) {
  const [isUnnecessary, setIsUnnecessary] = useState(item.isUnnecessary)

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const raw = new FormData(e.currentTarget).get('price')
    onSave({ itemId: item.id, price: parseYen(String(raw ?? '')), isUnnecessary })
  }

  return (
    <form
      className="flex min-h-11 items-center gap-2 border-t-2 border-dashed border-gray"
      onSubmit={submit}
    >
      <div className="flex-1">{item.name}</div>
      <input
        name="price"
        inputMode="numeric"
        aria-label={`${item.name}の金額`}
        defaultValue={item.price ?? ''}
        className="min-h-11 w-24 rounded-[14px] border-3 border-ink bg-white px-2 py-1.5"
      />
      <label className="flex min-h-11 cursor-pointer items-center gap-1 text-[13px]">
        <input
          type="checkbox"
          className="sr-only"
          checked={isUnnecessary}
          onChange={(e) => setIsUnnecessary(e.target.checked)}
        />
        <i
          className={`inline-block size-[26px] rounded-lg border-3 border-ink ${isUnnecessary ? 'bg-red' : 'bg-white'}`}
        />
        不要買い
      </label>
      <Button type="submit" variant="sun" small className="mb-0! w-auto! px-3 py-1.5">
        保存
      </Button>
    </form>
  )
}
