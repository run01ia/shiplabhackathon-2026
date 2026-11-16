export type HistoryTab = 'points' | 'lists'

const tabs: { key: HistoryTab; label: string }[] = [
  { key: 'points', label: 'ポイント' },
  { key: 'lists', label: '買い物' },
]

type Props = { value: HistoryTab; onChange: (tab: HistoryTab) => void }

/** 「ポイント / 買い物」の切り替え (モックの .seg) */
export function HistoryTabs({ value, onChange }: Props) {
  return (
    <div
      className="mb-3.5 flex overflow-hidden rounded-[14px] border-3 border-ink bg-white"
      role="tablist"
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={value === t.key}
          className={`min-h-11 flex-1 cursor-pointer border-0 ${value === t.key ? 'bg-sun' : 'bg-transparent'}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
