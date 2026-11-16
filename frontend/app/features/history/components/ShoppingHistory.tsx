import { Card } from '~/components/Card'
import { formatDate, sumPrices } from '../logic/format'
import type { HistoryList } from '../types'
import { HistoryItemEditor, type ItemFix } from './HistoryItemEditor'
import { HistoryItemRow } from './HistoryItemRow'

type Props = {
  lists: HistoryList[]
  editingId: string | null
  onEdit: (itemId: string) => void
  onSave: (fix: ItemFix) => void
}

/** 買い物の履歴 (日付・予算・使った金額・品目) */
export function ShoppingHistory({ lists, editingId, onEdit, onSave }: Props) {
  if (lists.length === 0) return <p className="text-sm text-muted">まだ買い物の履歴がありません</p>
  return lists.map(({ list, items }) => (
    <Card key={list.id}>
      <div className="flex items-center justify-between gap-2">
        <b>{formatDate(list.finishedAt ?? list.createdAt)}</b>
        <span className="text-xs font-normal text-muted">
          予算 ¥{list.budget.toLocaleString()} / 使った ¥{sumPrices(items).toLocaleString()}
        </span>
      </div>
      <div className="mt-2">
        {items.map((item) =>
          item.id === editingId ? (
            <HistoryItemEditor key={item.id} item={item} onSave={onSave} />
          ) : (
            <HistoryItemRow key={item.id} item={item} onEdit={onEdit} />
          ),
        )}
      </div>
    </Card>
  ))
}
