import { Button } from '~/components/Button'
import type { HistoryItem } from '../types'

type Props = { item: HistoryItem; onEdit: (itemId: string) => void }

/** 品目 1 行 (表示)。「なおす」で編集に切り替える */
export function HistoryItemRow({ item, onEdit }: Props) {
  return (
    <div className="flex min-h-11 items-center gap-2 border-t-2 border-dashed border-gray">
      <div className="flex-1">
        {item.name}
        {item.isUnnecessary ? (
          <span className="ml-1 text-xs font-normal text-red">不要買い</span>
        ) : null}
      </div>
      <div className="tabular-nums">
        {item.price == null ? '—' : `¥${item.price.toLocaleString()}`}
      </div>
      <Button
        variant="sub"
        small
        className="mb-0! w-auto! px-3 py-1.5"
        onClick={() => onEdit(item.id)}
      >
        なおす
      </Button>
    </div>
  )
}
