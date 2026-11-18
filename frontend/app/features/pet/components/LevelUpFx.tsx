import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useEffectEvent, useState } from 'react'
import type { LevelUp } from '../hooks/useLevelUp'

type Props = {
  levelUp: LevelUp
  /** このレベルアップで増えた見た目の名前 */
  perks: readonly string[]
  onDone: () => void
}

const SHOW_MS = 2600
const FADE_MS = 350
const INK = '#2b2118'
const STAR = 'M0-10l2.9 6.2 6.8.8-5 4.6 1.3 6.7L0 5l-6 3.3 1.3-6.7-5-4.6 6.8-.8z'
// 帯のまわりに飛び出す星 (角度 = 度、距離 = px)。乱数を使わず、描き直しても同じ
const STARS = [
  { angle: -160, far: 150, size: 22 },
  { angle: -125, far: 120, size: 30 },
  { angle: -90, far: 105, size: 20 },
  { angle: -55, far: 125, size: 28 },
  { angle: -20, far: 150, size: 22 },
  { angle: 25, far: 140, size: 18 },
  { angle: 155, far: 140, size: 18 },
] as const
const RAYS = Array.from({ length: 12 }, (_, i) => i * 30)

// 紙吹雪は使うときにだけ読み込む。左右から 1 回ずつ、星を混ぜて打ち上げる
const cannons = async () => {
  const { default: fire } = await import('canvas-confetti')
  const shoot = (x: number, angle: number) =>
    fire({
      particleCount: 60,
      angle,
      spread: 62,
      startVelocity: 46,
      scalar: 1.1,
      origin: { x, y: 0.62 },
      shapes: ['star', 'circle', 'square'],
      colors: ['#ffc93c', '#f2542d', '#3dbe8b', '#ffb3a7', '#ffffff'],
      disableForReducedMotion: true,
    })
  shoot(0.08, 62)
  setTimeout(() => shoot(0.92, 118), 180)
}

/** 猫のうしろで回る後光。部屋 (PetRoom) の中の、猫より前に書く (= 猫の下に重なる) */
export function LevelUpRays() {
  const reduced = useReducedMotion()
  if (reduced) return null
  return (
    <motion.svg
      viewBox="-100 -100 200 200"
      className="pointer-events-none absolute top-1/2 left-1/2 -mt-60 -ml-60 size-120"
      aria-hidden="true"
      initial={{ scale: 0.2, opacity: 0, rotate: 0 }}
      animate={{ scale: 1, opacity: [0, 0.85, 0.85, 0], rotate: 80 }}
      transition={{
        scale: { type: 'spring', stiffness: 160, damping: 14 },
        opacity: { duration: (SHOW_MS + FADE_MS) / 1000, times: [0, 0.1, 0.85, 1] },
        rotate: { duration: (SHOW_MS + FADE_MS) / 1000, ease: 'linear' },
      }}
    >
      {RAYS.map((deg) => (
        <path key={deg} d="M0 0L-10-100h20z" fill="#fff6c2" transform={`rotate(${deg})`} />
      ))}
    </motion.svg>
  )
}

/**
 * レベルアップの演出。猫の下に帯が弾んで出て、星が飛び、紙吹雪が左右から上がる (猫の喜ぶ姿は隠さない)。
 * 動かすのは transform と opacity だけ。reduced-motion では、帯を出すだけにする。
 */
export function LevelUpFx({ levelUp, perks, onDone }: Props) {
  const reduced = useReducedMotion()
  const [leaving, setLeaving] = useState(false)
  const done = useEffectEvent(onDone)

  useEffect(() => {
    cannons()
    const hide = setTimeout(() => setLeaving(true), SHOW_MS)
    const end = setTimeout(done, SHOW_MS + FADE_MS)
    return () => {
      clearTimeout(hide)
      clearTimeout(end)
    }
  }, [])

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
      aria-live="polite"
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: FADE_MS / 1000 }}
    >
      <div className="absolute inset-x-0 top-[45%] flex justify-center">
        {reduced
          ? null
          : STARS.map((s, i) => {
              const rad = (s.angle * Math.PI) / 180
              return (
                <motion.svg
                  key={s.angle}
                  viewBox="-12 -12 24 24"
                  className="absolute top-1/2 left-1/2"
                  style={{
                    width: s.size,
                    height: s.size,
                    marginTop: -s.size / 2,
                    marginLeft: -s.size / 2,
                  }}
                  aria-hidden="true"
                  initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: -40 }}
                  animate={{
                    x: Math.cos(rad) * s.far,
                    y: Math.sin(rad) * s.far * 0.7,
                    scale: [0, 1.3, 1, 0.6],
                    opacity: [0, 1, 1, 0],
                    rotate: 50,
                  }}
                  transition={{ duration: 1.5, delay: 0.12 + i * 0.05, ease: 'easeOut' }}
                >
                  <path
                    d={STAR}
                    fill="#fff"
                    stroke={INK}
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              )
            })}
        <motion.div
          className="relative rounded-card border-3 border-ink bg-sun px-6 pt-2.5 pb-3 text-center whitespace-nowrap shadow-pop-lg"
          initial={reduced ? false : { scale: 0.3, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 11 }}
        >
          <small className="block text-xs tracking-[0.25em]">LEVEL UP!</small>
          <b className="block text-[38px] leading-tight">
            Lv.{levelUp.to}
            <span className="ml-1 text-xl">になった！</span>
          </b>
          {perks.length > 0 ? (
            <motion.div
              className="mt-1.5 rounded-pill border-2 border-ink bg-paper px-3 py-1 text-sm"
              initial={reduced ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 14, delay: 0.55 }}
            >
              あたらしい すがた: {perks.join('・')}
            </motion.div>
          ) : null}
        </motion.div>
      </div>
    </motion.div>
  )
}
