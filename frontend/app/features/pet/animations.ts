import type { Mood, PartName, Side } from './types'

/**
 * 動きはパーツ名で指定する (キャラに依存しない)。
 * ずっと動くもの (まばたき・しっぽ・呼吸・耳・首かしげ) は CSS keyframes、反応 (ぺち・喜ぶ・しょんぼり) は Motion。
 * どれも transform と opacity だけを動かす。周期を互いに割り切れない秒数にして、同じ並びが繰り返して見えないようにする。
 */
export const KEYFRAMES = `
@keyframes pet-blink{0%,27%,31%,61%,64.5%,68%,100%{transform:scaleY(1)}29%,62.8%,66.3%{transform:scaleY(.08)}}
@keyframes pet-wag{0%,100%{transform:rotate(-5deg)}16%{transform:rotate(11deg)}33%{transform:rotate(-3deg)}50%{transform:rotate(13deg)}64%,84%{transform:rotate(3deg)}}
@keyframes pet-wag-joy{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(18deg)}}
@keyframes pet-wag-sad{0%,100%{transform:rotate(16deg)}50%{transform:rotate(20deg)}}
@keyframes pet-breathe{0%,100%{transform:scale(1.008,.99)}50%{transform:scale(.994,1.022)}}
@keyframes pet-wag-sleep{0%,100%{transform:rotate(12deg)}50%{transform:rotate(15deg)}}
@keyframes pet-breathe-deep{0%,100%{transform:scale(1.014,.976)}50%{transform:scale(.99,1.03)}}
@keyframes pet-zzz{0%{transform:translate(0,0) scale(.5);opacity:0}20%{opacity:1}100%{transform:translate(-.9em,-2.2em) scale(1.25);opacity:0}}
@keyframes pet-ear{0%,38%,46%,100%{transform:rotate(0)}40%,44%{transform:rotate(-13deg)}42%{transform:rotate(-3deg)}}
@keyframes pet-glint{0%,100%{transform:scale(1);opacity:1}45%{transform:scale(.35);opacity:.3}}
@keyframes pet-tilt{0%,52%,80%,100%{transform:rotate(0)}58%,74%{transform:rotate(4deg)}}
`

/** 常に動いているパーツ (Tailwind の任意値。reduced-motion では止める) */
export const IDLE: Partial<Record<PartName, string>> = {
  eyes: 'animate-[pet-blink_7.3s_infinite] motion-reduce:animate-none',
  earLeft: 'animate-[pet-ear_13.3s_ease-in-out_infinite] motion-reduce:animate-none',
  earRight: 'animate-[pet-ear_9.1s_ease-in-out_infinite] motion-reduce:animate-none',
  head: 'animate-[pet-tilt_11.7s_ease-in-out_infinite] motion-reduce:animate-none',
}
/** しっぽは気分で振り方が変わる (うれしい = 速い、しょんぼり = 垂れる) */
export const TAIL: Record<Mood, string> = {
  happy: 'animate-[pet-wag_5.2s_ease-in-out_infinite] motion-reduce:animate-none',
  joy: 'animate-[pet-wag-joy_.45s_ease-in-out_infinite] motion-reduce:animate-none',
  sad: 'animate-[pet-wag-sad_3.8s_ease-in-out_infinite] motion-reduce:animate-none',
  sleep: 'animate-[pet-wag-sleep_4.6s_ease-in-out_infinite] motion-reduce:animate-none',
}
export const BREATHE =
  'origin-bottom animate-[pet-breathe_3.4s_ease-in-out_infinite] motion-reduce:animate-none'

/** 居眠り中の、深くゆっくりした呼吸と、浮かぶ「z」 */
export const BREATHE_SLEEP =
  'origin-bottom animate-[pet-breathe-deep_4.6s_ease-in-out_infinite] motion-reduce:animate-none'
export const ZZZ =
  'absolute opacity-0 animate-[pet-zzz_2.7s_ease-out_infinite] motion-reduce:animate-none motion-reduce:opacity-100'

/** 育つと増える光 (ほっぺ)。自分の中心で、またたく */
export const GLINT =
  '[transform-box:fill-box] origin-center animate-[pet-glint_2.6s_ease-in-out_infinite] motion-reduce:animate-none'

/** ぺち: 手を素早く持ち上げて叩きつけ、体が一瞬つぶれて戻る */
export const TAP = {
  part: { left: 'pawLeft', right: 'pawRight' } satisfies Record<Side, PartName>,
  /** 持ち上げる高さ (viewBox の高さに対する割合) */
  lift: 0.13,
  liftReduced: 0.03,
  /** 持ち上げてから叩くまで (秒)。反応の速さが気持ちよさを決めるので短くする */
  duration: 0.16,
  /** 叩いた瞬間の体のつぶれ (scaleY) */
  squash: 0.95,
} as const

/** 喜ぶ: 溜め (つぶれる) → 跳ねる (伸びる) → 着地 (つぶれる) → 戻る */
export const HOP = {
  /** 跳ぶ高さ (表示サイズに対する割合) */
  height: 0.1,
  duration: 0.6,
  times: [0, 0.2, 0.48, 0.74, 1],
  scaleY: [1, 0.88, 1.08, 0.92, 1],
} as const

/** しょんぼり・居眠り: 頭が沈み、耳が垂れる (viewBox の単位、度) */
export const DROOP: Record<Mood, { head: number; ear: number }> = {
  happy: { head: 0, ear: 0 },
  joy: { head: 0, ear: 0 },
  sad: { head: 5, ear: 16 },
  sleep: { head: 4, ear: 9 },
}

/** 喜び方。同じ動きが続くと飽きるので、なでた回数 (pulse) で変える */
export type JoyKind = 'hop' | 'wiggle' | 'spin'
/** 何回目ごとに大技 (くるんと宙返り) を出すか。溜めてから解放する */
export const BIG_EVERY = 5
export const joyKind = (pulse: number): JoyKind =>
  pulse === 0 ? 'hop' : pulse % BIG_EVERY === 0 ? 'spin' : pulse % 2 === 1 ? 'hop' : 'wiggle'

/** 首をふる (度) と、宙返りの高さ (表示サイズに対する割合) */
export const WIGGLE = [0, -9, 8, -6, 4, 0] as const
export const SPIN_HEIGHT = 0.24
