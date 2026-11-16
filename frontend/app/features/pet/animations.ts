import type { PartName, Side } from './types'

/**
 * 動きはパーツ名で指定する (キャラに依存しない)。
 * まばたき・しっぽ・呼吸は CSS keyframes、ぺちだけ Motion。どれも transform と opacity だけを動かす。
 */
export const KEYFRAMES = `
@keyframes pet-blink{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
@keyframes pet-wag{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(10deg)}}
@keyframes pet-breathe{50%{transform:scaleY(1.025)}}
`

/** 常に動いているパーツ (Tailwind の任意値。reduced-motion では止める) */
export const IDLE: Partial<Record<PartName, string>> = {
  eyes: 'animate-[pet-blink_4.2s_infinite] motion-reduce:animate-none',
  tail: 'animate-[pet-wag_2.6s_ease-in-out_infinite] motion-reduce:animate-none',
}
export const BREATHE =
  'origin-bottom animate-[pet-breathe_3.2s_ease-in-out_infinite] motion-reduce:animate-none'

/** ぺち: 手を持ち上げて、叩きつける */
export const TAP = {
  part: { left: 'pawLeft', right: 'pawRight' } satisfies Record<Side, PartName>,
  /** 持ち上げる高さ (viewBox の高さに対する割合) */
  lift: 0.12,
  liftReduced: 0.03,
  duration: 0.24,
} as const
