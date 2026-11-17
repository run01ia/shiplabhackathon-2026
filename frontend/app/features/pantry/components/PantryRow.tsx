import { useFetcher } from 'react-router'
import { Button } from '~/components/Button'
import { PANTRY_INTENT } from '../logic/action'
import { stockedAgo } from '../logic/notice'
import type { PantryItem } from '../types'

/** 在庫 1 行。「ある / 少ない」はタップで切り替え、「なくなった」で消す (送信先はルートの clientAction) */
export function PantryRow({ item, now }: { item: PantryItem; now: Date }) {
  const fetcher = useFetcher()
  // 送信中は楽観的に表示を変える
  const pending = fetcher.formData
  if (pending?.get('intent') === PANTRY_INTENT.remove) return null
  const status =
    pending?.get('intent') === PANTRY_INTENT.status ? pending.get('status') : item.status
  const low = status === 'low'

  return (
    <div className="flex items-center gap-2 border-gray border-b-2 border-dashed py-2 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="truncate">{item.name}</div>
        <div className="text-muted text-xs font-normal">{stockedAgo(item.stockedAt, now)}</div>
      </div>
      <fetcher.Form method="post">
        <input type="hidden" name="intent" value={PANTRY_INTENT.status} />
        <input type="hidden" name="pantryId" value={item.id} />
        <input type="hidden" name="status" value={low ? 'have' : 'low'} />
        <Button
          type="submit"
          variant={low ? 'sun' : 'mint'}
          small
          className="mb-0! w-18! px-2"
          aria-label={`${item.name}: ${low ? '少ない' : 'ある'} (タップで切り替え)`}
        >
          {low ? '少ない' : 'ある'}
        </Button>
      </fetcher.Form>
      <fetcher.Form method="post">
        <input type="hidden" name="intent" value={PANTRY_INTENT.remove} />
        <input type="hidden" name="pantryId" value={item.id} />
        <Button type="submit" variant="sub" small className="mb-0! w-auto! px-2.5">
          なくなった
        </Button>
      </fetcher.Form>
    </div>
  )
}
