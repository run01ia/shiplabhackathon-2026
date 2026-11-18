import type { ListItem } from '../types'

type Props = {
  item: ListItem
  /** なければ表示だけ (終了画面のリスト外の品目) */
  onPurchase?: (item: ListItem) => void
}

const rowClass =
  'flex min-h-13 w-full items-center gap-2.5 border-b-2 border-dashed border-gray py-1.5 last:border-b-0'

/** 品目 1 行。ワンタップでかごに入れる (金額は入れない。合計は終了画面で入れる) */
export function ItemRow({ item, onPurchase }: Props) {
  const done = item.isChecked
  const content = (
    <>
      <span
        className={`grid size-8 flex-none place-items-center rounded-[10px] border-3 border-ink text-paper ${done ? 'bg-mint' : 'bg-white'}`}
      >
        {done ? '✓' : null}
      </span>
      <span className={`flex-1 ${done ? 'text-muted line-through' : ''}`}>{item.name}</span>
    </>
  )

  if (!onPurchase) return <div className={rowClass}>{content}</div>

  return (
    <button
      type="button"
      className={`${rowClass} cursor-pointer border-x-0 border-t-0 bg-transparent px-0 text-left text-base text-ink disabled:cursor-default`}
      onClick={() => onPurchase(item)}
      disabled={done}
      aria-label={done ? `${item.name} (かごに入れた)` : `${item.name} をかごに入れる`}
    >
      {content}
    </button>
  )
}
