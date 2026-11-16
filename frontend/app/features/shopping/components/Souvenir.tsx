import { motion, useReducedMotion } from 'motion/react'
import { useRef, useState } from 'react'
import { Card } from '~/components/Card'
import { findAccessory } from '~/features/pet'
import type { Drop } from '../types'

type Rarity = Extract<Drop, { key: string }>['rarity']
type Props = { drop: Drop; onOpen?: () => void }

const INK = '#2b2118'
/** レア度ごとの見た目。particles は紙吹雪の量、rays は後光 (レア以上) */
const RARITY: Record<Rarity, { label: string; color: string; particles: number; rays: boolean }> = {
  common: { label: 'ふつう', color: '#3dbe8b', particles: 40, rays: false },
  rare: { label: 'レア', color: '#4aa3ff', particles: 90, rays: true },
  epic: { label: '激レア', color: '#b98cff', particles: 170, rays: true },
}
const COIN_FX = { color: '#ffc93c', particles: 30, rays: false }

// 紙吹雪は使うときにだけ読み込む。箱の位置から出す
const burst = async (el: HTMLElement | null, color: string, particles: number) => {
  const { default: fire } = await import('canvas-confetti')
  const r = el?.getBoundingClientRect()
  const origin = r
    ? {
        x: (r.left + r.width / 2) / window.innerWidth,
        y: (r.top + r.height / 2) / window.innerHeight,
      }
    : { x: 0.5, y: 0.6 }
  const shoot = (particleCount: number, spread: number) =>
    fire({
      particleCount,
      spread,
      startVelocity: 24 + particles / 8,
      origin,
      colors: [color, '#ffc93c', '#f2542d', '#ffffff'],
      disableForReducedMotion: true,
    })
  shoot(particles, 60 + particles / 3)
  // 激レアだけ、もう一度大きく
  if (particles > 120) setTimeout(() => shoot(particles / 2, 150), 260)
}

const box = (
  <>
    <rect x="14" y="44" width="72" height="48" rx="8" fill="#ffc93c" stroke={INK} strokeWidth="5" />
    <rect x="44" y="46" width="12" height="44" fill="#f2542d" />
  </>
)
const lid = (
  <>
    <rect x="8" y="28" width="84" height="20" rx="7" fill="#ffc93c" stroke={INK} strokeWidth="5" />
    <rect x="44" y="30" width="12" height="16" fill="#f2542d" />
    <path
      d="M50 28q-18-22-24-8q-2 10 24 8zM50 28q18-22 24-8q2 10-24 8z"
      fill="#f2542d"
      stroke={INK}
      strokeWidth="4"
      strokeLinejoin="round"
    />
  </>
)

/**
 * おみやげ (予算内クリアのごほうび)。箱をタップ → 揺れる → ふたが飛んで帽子が出る。
 * レア度で色・後光・紙吹雪の量が変わる。動かすのは transform と opacity だけ。
 * reduced-motion では揺らさず、紙吹雪も出さない。
 */
export function Souvenir({ drop, onOpen }: Props) {
  const [stage, setStage] = useState<'closed' | 'shaking' | 'open'>('closed')
  const stageRef = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()
  const hat = 'key' in drop ? drop : null
  const fx = hat ? RARITY[hat.rarity] : COIN_FX
  const accessory = hat ? findAccessory(hat.key) : undefined
  const isOpen = stage === 'open'

  const reveal = () => {
    setStage('open')
    onOpen?.()
    burst(stageRef.current, fx.color, fx.particles)
  }
  const start = () => {
    if (stage !== 'closed') return
    // 揺れている間に読み込んでおく
    void import('canvas-confetti')
    if (reduced) reveal()
    else setStage('shaking')
  }

  const boxMotion = isOpen
    ? { rotate: 0, scale: 0.6, y: 24, opacity: 0 }
    : stage === 'shaking'
      ? { rotate: [0, -11, 11, -11, 11, -6, 6, 0], scale: [1, 1.1, 1.1, 1.1, 1.1, 1.05, 1.05, 1] }
      : reduced
        ? {}
        : { rotate: [0, -4, 4, -2, 0] }

  return (
    <Card className="text-center">
      <b className="block">おみやげ</b>
      <button
        ref={stageRef}
        type="button"
        className="relative mx-auto block h-36 w-full cursor-pointer border-0 bg-transparent p-0 disabled:cursor-default"
        aria-label="おみやげの箱をあける"
        disabled={stage !== 'closed'}
        onClick={start}
      >
        {isOpen ? (
          <motion.span
            className="absolute top-1/2 left-1/2 -mt-16 -ml-16 block size-32 rounded-full"
            style={{
              background: fx.rays
                ? `repeating-conic-gradient(${fx.color} 0 14deg, transparent 14deg 30deg)`
                : fx.color,
            }}
            initial={{ scale: 0.3, opacity: 0, rotate: 0 }}
            animate={{ scale: 1, opacity: 0.4, rotate: fx.rays && !reduced ? 360 : 0 }}
            transition={{
              scale: { type: 'spring', stiffness: 260, damping: 16 },
              opacity: { duration: 0.3 },
              rotate: { duration: 14, ease: 'linear', repeat: Number.POSITIVE_INFINITY },
            }}
          />
        ) : null}
        <motion.span
          className="absolute inset-0 grid place-items-center"
          animate={boxMotion}
          transition={
            stage === 'closed'
              ? { duration: 0.6, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1.1 }
              : { duration: isOpen ? 0.25 : 0.75 }
          }
          onAnimationComplete={() => {
            if (stage === 'shaking') reveal()
          }}
        >
          <svg viewBox="0 0 100 100" className="size-28 overflow-visible" aria-hidden="true">
            {box}
            <motion.g
              animate={isOpen && !reduced ? { y: -70, rotate: -35, opacity: 0 } : { y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {lid}
            </motion.g>
          </svg>
        </motion.span>
        {isOpen ? (
          <motion.span
            className="absolute inset-0 grid place-items-center"
            initial={{ scale: reduced ? 1 : 0.2, y: reduced ? 0 : 36, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 360, damping: 13 }}
          >
            {accessory ? (
              <svg viewBox={accessory.iconViewBox} className="h-24 w-32" aria-hidden="true">
                {accessory.art}
              </svg>
            ) : (
              <span className="grid size-20 place-items-center rounded-full border-3 border-ink bg-sun text-2xl">
                +{'coins' in drop ? drop.coins : ''}
              </span>
            )}
          </motion.span>
        ) : null}
      </button>
      <div className="min-h-14" aria-live="polite">
        {!isOpen ? (
          <span className="text-sm font-normal text-muted">箱をタップして あけてみよう</span>
        ) : hat ? (
          <>
            <span
              className="inline-block rounded-pill border-3 border-ink px-2.5 text-xs"
              style={{ background: fx.color }}
            >
              {RARITY[hat.rarity].label}
            </span>
            <b className="block text-lg">{hat.name}</b>
            <span className="text-xs font-normal text-muted">きがえで着られるよ</span>
          </>
        ) : (
          <>
            <b className="block text-lg">コイン +{'coins' in drop ? drop.coins : 0}</b>
            <span className="text-xs font-normal text-muted">
              あたらしい帽子は また今度。かわりにコインをもらったよ
            </span>
          </>
        )}
      </div>
    </Card>
  )
}
