import { useState } from 'react'
import { useFetcher } from 'react-router'
import { Button } from '~/components/Button'
import { fieldClass } from './fieldClass'

/** note: 名前の下に出す注意 (家の在庫にあるとき「家に◯◯があるよ」) */
type Props = { listId: string; id: string; name: string; note?: string }

/** 品目 1 行。名前タップで編集、削除ボタンで削除 (送信先はルートの clientAction) */
export function ItemRow({ listId, id, name, note }: Props) {
  const fetcher = useFetcher()
  const [editing, setEditing] = useState(false)
  // 送信中は楽観的に表示を変える
  const pendingIntent = fetcher.formData?.get('intent')
  if (pendingIntent === 'delete') return null
  const shown = pendingIntent === 'rename' ? String(fetcher.formData?.get('name')) : name

  return (
    <div className="flex items-center gap-2.5 border-gray border-b-2 border-dashed py-2.5 last:border-0">
      {editing ? (
        <fetcher.Form method="post" className="flex-1" onSubmit={() => setEditing(false)}>
          <input type="hidden" name="intent" value="rename" />
          <input type="hidden" name="listId" value={listId} />
          <input type="hidden" name="itemId" value={id} />
          <input
            className={fieldClass}
            name="name"
            defaultValue={name}
            aria-label="品目名"
            maxLength={100}
            required
            // biome-ignore lint/a11y/noAutofocus: 名前をタップして編集を始めた直後なので入力欄に移す
            autoFocus
            onBlur={(e) => {
              // Enter で送信した後の blur は、要素が外れて React に届かない
              const v = e.currentTarget.value.trim()
              if (v && v !== name) e.currentTarget.form?.requestSubmit()
              else setEditing(false)
            }}
          />
        </fetcher.Form>
      ) : (
        <button
          type="button"
          className="min-h-11 flex-1 cursor-pointer border-0 bg-transparent p-0 text-left"
          onClick={() => setEditing(true)}
        >
          {shown}
          {note && pendingIntent !== 'rename' ? (
            <span className="block text-red text-xs">{note}</span>
          ) : null}
        </button>
      )}
      <fetcher.Form method="post">
        <input type="hidden" name="intent" value="delete" />
        <input type="hidden" name="listId" value={listId} />
        <input type="hidden" name="itemId" value={id} />
        <Button type="submit" variant="sub" small className="mb-0! w-auto! px-3.5">
          削除
        </Button>
      </fetcher.Form>
    </div>
  )
}
