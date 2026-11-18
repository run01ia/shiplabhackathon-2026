import { motion, useReducedMotion } from 'motion/react'

const INK = '#2b2118'
/** レシートの行 (y, 幅) */
const LINES = [
  [30, 52],
  [44, 40],
  [58, 58],
  [72, 34],
  [86, 48],
  [100, 42],
] as const

/** 読み取り中: レシートの上を光の線が行き来し、行が順に光る。動かすのは transform と opacity だけ */
export function ReceiptScanning() {
  const reduced = useReducedMotion()
  return (
    <div className="py-2 text-center" role="status" aria-live="polite">
      <svg viewBox="0 0 100 140" className="mx-auto block h-36 w-28 overflow-visible" aria-hidden>
        <motion.g
          animate={reduced ? {} : { rotate: [-2, 2, -2] }}
          transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          style={{ transformOrigin: '50px 10px' }}
        >
          <path
            d="M14 8h72v112l-9 8-9-8-9 8-9-8-9 8-9-8-9 8-9-8z"
            fill="#fffdf6"
            stroke={INK}
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {LINES.map(([y, w], i) => (
            <motion.rect
              key={y}
              x="24"
              y={y}
              width={w}
              height="6"
              rx="3"
              fill="#d9ccb4"
              animate={reduced ? {} : { opacity: [0.35, 1, 0.35] }}
              transition={{
                duration: 1.6,
                delay: i * 0.18,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            />
          ))}
          {reduced ? null : (
            <motion.rect
              x="8"
              y="20"
              width="84"
              height="7"
              rx="3.5"
              fill="#3dbe8b"
              stroke={INK}
              strokeWidth="2.5"
              animate={{ y: [0, 88, 0] }}
              transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            />
          )}
        </motion.g>
      </svg>
      <b className="mt-1 block">レシートを よんでいるよ…</b>
      <span className="text-xs font-normal text-muted">10 秒くらい かかるよ</span>
    </div>
  )
}
