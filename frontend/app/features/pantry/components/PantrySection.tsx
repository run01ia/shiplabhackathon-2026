import { useState } from 'react'
import { useFetcher } from 'react-router'
import { Button } from '~/components/Button'
import { Card } from '~/components/Card'
import { PANTRY_INTENT } from '../logic/action'
import type { PantryItem } from '../types'
import { PantryRow } from './PantryRow'

// 入力欄の見た目 (list の fieldClass と同じ。feature をまたげないので、ここにも置く)
const fieldClass =
  'block min-h-12 w-full min-w-0 rounded-btn border-3 border-ink bg-white px-3 py-2 text-base'

/** リスト画面の上の折りたたみ「家にあるもの」。開くと、状態の切り替え・削除・手での追加ができる */
export function PantrySection({ items, now }: { items: PantryItem[]; now: Date }) {
  const [open, setOpen] = useState(false)
  const adder = useFetcher()

  return (
    <Card className="p-0">
      <button
        type="button"
        className="flex min-h-12 w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3.5 text-left"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          家にあるもの <span className="text-muted text-sm font-normal">{items.length} 個</span>
        </span>
        <span className="text-muted text-xs font-normal">{open ? 'とじる ▲' : 'ひらく ▼'}</span>
      </button>
      {open ? (
        <div className="px-3.5 pb-3.5">
          {items.length > 0 ? (
            items.map((it) => <PantryRow key={it.id} item={it} now={now} />)
          ) : (
            <p className="py-2 text-sm font-normal">
              まだ空っぽ。買い物のあとに、買ったものをワンタップで入れられるよ
            </p>
          )}
          <adder.Form
            method="post"
            className="mt-2.5 flex items-center gap-2.5"
            onSubmit={(e) => {
              // 送信内容を先に読み取ってから空にする (続けて打てるように)
              e.preventDefault()
              const form = e.currentTarget
              adder.submit(form)
              form.reset()
            }}
          >
            <input type="hidden" name="intent" value={PANTRY_INTENT.add} />
            <input
              className={fieldClass}
              name="name"
              placeholder="家にあるものを追加"
              aria-label="家にあるものを追加"
              maxLength={100}
              autoComplete="off"
              required
            />
            <Button
              type="submit"
              variant="sub"
              small
              className="mb-0! w-auto! shrink-0 px-4"
              disabled={adder.state !== 'idle'}
            >
              追加
            </Button>
          </adder.Form>
        </div>
      ) : null}
    </Card>
  )
}
