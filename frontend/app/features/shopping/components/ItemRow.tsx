import { formatYen } from '../logic/yen'
import type { ListItem } from '../types'

type Props = { item: ListItem; onTap?: (item: ListItem) => void }

/** 品目 1 行。タップで金額入力を開く (購入済みでも金額を直せる) */
export function ItemRow({ item, onTap }: Props) {
  const done = item.isChecked
  return (
    <button
      type="button"
      className="flex min-h-13 w-full cursor-pointer items-center gap-2.5 border-0 border-b-2 border-dashed border-gray bg-transparent py-2.5 text-left last:border-b-0"
      onClick={() => onTap?.(item)}
      disabled={!onTap}
    >
      <span
        className={`size-8 flex-none rounded-[10px] border-3 border-ink ${done ? 'bg-mint' : 'bg-white'}`}
      />
      <span className={`flex-1 ${done ? 'text-muted line-through' : ''}`}>{item.name}</span>
      <span className="tabular-nums">{item.price === null ? '—' : formatYen(item.price)}</span>
    </button>
  )
}
