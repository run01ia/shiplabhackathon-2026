import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ProgressBar } from '~/components/ProgressBar'

type Props = {
  level: number
  /** 今のレベルで貯めた経験値と、次のレベルに必要な量 (0 なら最大レベル) */
  value: number
  max: number
  /** レベルアップの直前: filling = コインが届いてゲージが満ちていく、full = 満ちて数字が変わるのを待つ */
  rising?: 'filling' | 'full' | null
}

/** ホームの左上: レベルの数字と、次のレベルまでのゲージ。レベルが変わると数字が跳ねる */
export function LevelBadge({ level, value, max, rising = null }: Props) {
  const reduced = useReducedMotion()
  const top = max <= 0
  const label = rising
    ? rising === 'full'
      ? 'レベルアップ！'
      : 'もうすぐ レベルアップ…'
    : top
      ? 'さいこうレベル'
      : `つぎの Lv まで あと ${Math.max(0, max - value)}`
  return (
    <>
      <div>
        <div className="text-xs font-normal text-muted">買い物上手</div>
        {/* initial={false}: 最初の表示では跳ねない。key (レベル) が変わったときだけ跳ねる */}
        <AnimatePresence initial={false}>
          <motion.b
            key={level}
            className="inline-block origin-bottom-left text-xl"
            initial={reduced ? false : { scale: 2.4, rotate: -14 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 9 }}
          >
            Lv.{level}
          </motion.b>
        </AnimatePresence>
      </div>
      <div className="flex-1">
        <ProgressBar
          value={top || rising === 'full' ? 1 : value}
          max={top || rising === 'full' ? 1 : max}
          color={rising === 'full' ? 'var(--color-red)' : 'var(--color-sun)'}
        />
        <div className="mt-0.5 text-right text-[11px] leading-none font-normal text-muted">
          {label}
        </div>
      </div>
    </>
  )
}
