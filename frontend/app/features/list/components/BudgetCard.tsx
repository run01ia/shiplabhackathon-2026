import { useFetcher } from 'react-router'
import { Card } from '~/components/Card'
import { parseBudget } from '../logic/parse'

const presets = [1000, 2000, 3000]

/** 今日の予算。カードの中で直接入力し、Enter かフォーカスを外したら保存する。よく使う金額はワンタップ */
export function BudgetCard({ listId, budget }: { listId: string; budget: number }) {
  const fetcher = useFetcher()
  const pending = fetcher.formData?.get('budget')
  const shown = pending != null ? Number(pending) : budget

  const save = (value: number) => {
    if (value === shown) return
    fetcher.submit({ intent: 'budget', listId, budget: String(value) }, { method: 'post' })
  }

  return (
    <Card>
      <label htmlFor="budget" className="block text-xs font-normal text-muted">
        今日の予算
      </label>
      <div className="flex items-center gap-1 border-b-3 border-ink">
        <span className="text-[26px]">¥</span>
        <input
          // 保存した値が変わったら入力欄も作り直す (プリセットを押したとき)
          key={shown}
          id="budget"
          className="w-full min-w-0 border-0 bg-transparent py-1 text-[30px] font-bold outline-none"
          type="number"
          inputMode="numeric"
          min={0}
          step={100}
          defaultValue={shown || ''}
          placeholder="2000"
          enterKeyHint="done"
          onBlur={(e) => {
            const raw = e.currentTarget.value
            const v = raw === '' ? null : parseBudget(raw)
            if (v != null) save(v)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
        />
      </div>
      <div className="mt-2.5 flex gap-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            className={`min-h-11 flex-1 cursor-pointer rounded-full border-3 border-ink text-sm ${shown === p ? 'bg-sun' : 'bg-white'}`}
            onClick={() => save(p)}
          >
            {p.toLocaleString()}円
          </button>
        ))}
      </div>
    </Card>
  )
}
