import type { ReactNode } from "react";

type Props = { open: boolean; onClose: () => void; children: ReactNode };

/** 背景タップと閉じるボタンで閉じるポップアップ */
export function BottomSheet({ open, onClose, children }: Props) {
  if (!open) return null;
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sheet-close" aria-label="閉じる" onClick={onClose}>
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
