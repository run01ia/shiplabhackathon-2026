import { useCallback, useState } from 'react'
import { useFetcher } from 'react-router'
import type { ItemFix } from '../components/HistoryItemEditor'

/** 「なおす」の編集状態と、route の clientAction への送信。送信中の値を pending で返す */
export function useFixItem(onSaved: () => void) {
  const fetcher = useFetcher()
  const [editingId, setEditingId] = useState<string | null>(null)

  const save = useCallback(
    (fix: ItemFix) => {
      const data: Record<string, string> = {
        itemId: fix.itemId,
        isUnnecessary: String(fix.isUnnecessary),
      }
      if (fix.price !== undefined) data.price = String(fix.price)
      fetcher.submit(data, { method: 'post' })
      setEditingId(null)
      // TODO(cat): tap()
      onSaved()
    },
    [fetcher.submit, onSaved],
  )

  const fd = fetcher.formData
  const pending: ItemFix | null = fd
    ? {
        itemId: String(fd.get('itemId')),
        price: fd.has('price') ? Number(fd.get('price')) : undefined,
        isUnnecessary: fd.get('isUnnecessary') === 'true',
      }
    : null

  return { editingId, startEdit: setEditingId, save, pending }
}
