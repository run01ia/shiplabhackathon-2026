import { type ReactNode, useEffect } from 'react'

type Props = { open: boolean; onClose: () => void; children: ReactNode }

/** 背景タップと閉じるボタンで閉じるポップアップ */
export function BottomSheet({ open, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="absolute inset-0 z-9 flex items-end">
      <button
        type="button"
        className="absolute inset-0 cursor-default border-0 bg-ink/45"
        aria-label="閉じる"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        className="relative w-full rounded-t-sheet border-3 border-b-0 border-ink bg-cream px-4.5 pt-5 pb-[calc(env(safe-area-inset-bottom)+28px)]"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="absolute top-2 right-2 size-11 cursor-pointer border-0 bg-transparent text-[22px]"
          aria-label="閉じる"
          onClick={onClose}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}
