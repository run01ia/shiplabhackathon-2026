type Props = { value: number; max?: number; color?: string }

/** ゲージ。伸び縮みは transform (scaleX) だけで動かす (幅を変えないので、再レイアウトが起きない) */
export function ProgressBar({ value, max = 100, color }: Props) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <div
      className="h-5 overflow-hidden rounded-xl border-3 border-ink bg-white"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
    >
      <b
        className="block size-full origin-left bg-mint transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `scaleX(${ratio})`, background: color }}
      />
    </div>
  )
}
