import type { ReactNode } from "react";

type Props = { open: boolean; onClose: () => void; children: ReactNode };

/** 背景タップと閉じるボタンで閉じるポップアップ */
export function BottomSheet({ open, onClose, children }: Props) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-9 flex items-end bg-ink/45" onClick={onClose}>
      <div className="relative w-full rounded-t-sheet border-3 border-b-0 border-ink bg-cream px-4.5 pt-5 pb-[calc(env(safe-area-inset-bottom)+28px)]" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="absolute top-2 right-2 size-11 cursor-pointer border-0 bg-transparent text-[22px]" aria-label="閉じる" onClick={onClose}>
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
