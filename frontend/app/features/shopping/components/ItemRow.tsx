import { formatYen, parseYen } from '../logic/yen'
import type { ListItem } from '../types'

type Props = {
  item: ListItem
  /** なければ表示だけ (終了画面のリスト外の品目) */
  onPurchase?: (item: ListItem, price: number) => void
}

const rowClass =
  'flex min-h-13 w-full items-center gap-2.5 border-b-2 border-dashed border-gray py-1.5 last:border-b-0'

/**
 * 品目 1 行。チェックはワンタップでかごに入れる。金額は行の右で直接入れる (任意。
 * 入れなくても、終了時にレジの合計を入れれば判定できる)
 */
export function ItemRow({ item, onPurchase }: Props) {
  const done = item.isChecked
  const box = (
    <span
      className={`grid size-8 flex-none place-items-center rounded-[10px] border-3 border-ink text-paper ${done ? 'bg-mint' : 'bg-white'}`}
    >
      {done ? '✓' : null}
    </span>
  )
  const name = (
    <span className={`flex-1 ${done ? 'text-muted line-through' : ''}`}>{item.name}</span>
  )

  if (!onPurchase) {
    return (
      <div className={rowClass}>
        {box}
        {name}
        <span className="tabular-nums">{item.price ? formatYen(item.price) : '—'}</span>
      </div>
    )
  }

  return (
    <div className={rowClass}>
      <button
        type="button"
        className="flex min-h-11 flex-1 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 text-left text-ink disabled:cursor-default"
        onClick={() => onPurchase(item, item.price ?? 0)}
        disabled={done}
        aria-label={done ? `${item.name} (かごに入れた)` : `${item.name} をかごに入れる`}
      >
        {box}
        {name}
      </button>
      <input
        key={item.price ?? 'none'}
        className="w-24 rounded-[10px] border-2 border-gray bg-white px-2 py-1.5 text-right tabular-nums focus:border-ink focus:outline-none"
        inputMode="numeric"
        placeholder="¥ いくら"
        aria-label={`${item.name} の金額`}
        defaultValue={item.price ? String(item.price) : ''}
        enterKeyHint="done"
        onBlur={(e) => {
          const raw = e.currentTarget.value
          if (raw === '') return
          const price = parseYen(raw)
          if (price !== null && price !== item.price) onPurchase(item, price)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />
    </div>
  )
}
