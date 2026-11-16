type Props = { value: number; max?: number; color?: string };

export function ProgressBar({ value, max = 100, color }: Props) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      className="h-5 overflow-hidden rounded-xl border-3 border-ink bg-white"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
    >
      <b className="block h-full bg-mint" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
