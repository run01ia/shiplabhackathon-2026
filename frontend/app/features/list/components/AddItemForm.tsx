import { useFetcher } from 'react-router'
import { Button } from '~/components/Button'
import { useCatTap } from '~/features/pet'
import { fieldClass } from './fieldClass'

/** 品目の追加欄。送信したらすぐ入力を空にして、続けて打てるようにする */
export function AddItemForm({ listId }: { listId: string }) {
  const fetcher = useFetcher()
  const { tap } = useCatTap()
  const busy = fetcher.state !== 'idle'

  return (
    <fetcher.Form
      method="post"
      className="flex items-center gap-2.5"
      onSubmit={(e) => {
        // 送信内容を先に読み取ってから空にする (effect ではなくイベントで処理する)
        e.preventDefault()
        const form = e.currentTarget
        fetcher.submit(form)
        form.reset()
        tap()
      }}
    >
      <input type="hidden" name="intent" value="add" />
      <input type="hidden" name="listId" value={listId} />
      <input
        className={fieldClass}
        name="name"
        placeholder="品目を追加"
        aria-label="品目を追加"
        maxLength={100}
        autoComplete="off"
        required
      />
      <Button type="submit" small className="mb-0 w-auto shrink-0 px-4" disabled={busy}>
        追加
      </Button>
    </fetcher.Form>
  )
}
