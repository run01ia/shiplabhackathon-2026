type Props = { value: number; max?: number; color?: string };

export function ProgressBar({ value, max = 100, color }: Props) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="bar" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <b style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
