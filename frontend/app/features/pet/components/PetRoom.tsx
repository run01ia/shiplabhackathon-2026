import { motion } from 'motion/react'
import { type ReactNode, useState } from 'react'

type Props = { bubble?: string; compact?: boolean; children: ReactNode }

/** 時間帯ごとの空。部屋を開く時間で景色が変わる (朝・昼・夕方・夜) */
type Sky = { key: 'morning' | 'day' | 'evening' | 'night'; top: string; low: string; floor: string }
const SKIES: readonly (Sky & { from: number })[] = [
  { from: 19, key: 'night', top: '#3b4a82', low: '#6f7fb8', floor: '#cfa871' },
  { from: 16, key: 'evening', top: '#ffb38a', low: '#ffe0a6', floor: '#e2b97c' },
  { from: 10, key: 'day', top: '#a9def0', low: '#cdeef6', floor: '#e8c48b' },
  { from: 5, key: 'morning', top: '#bfe6f2', low: '#ffe9c4', floor: '#e8c48b' },
]
const skyAt = (hour: number): Sky => SKIES.find((s) => hour >= s.from) ?? SKIES[0]

const STARS = [
  'top-[10%] left-[30%]',
  'top-[24%] left-[12%] [animation-delay:-1.1s]',
  'top-[8%] left-[58%] [animation-delay:-2.3s]',
  'top-[30%] right-[9%] [animation-delay:-0.6s]',
  'top-[44%] left-[6%] [animation-delay:-1.8s]',
]

const cloud = (className: string) => (
  <svg
    viewBox="0 0 60 26"
    className={`absolute animate-drift motion-reduce:animate-none ${className}`}
    aria-hidden="true"
  >
    <path d="M10 25a9 9 0 0 1 2-18a13 13 0 0 1 25-2a10 10 0 0 1 13 20z" fill="#fff" />
  </svg>
)

/** ペットの部屋 (時間帯の空、太陽か月、雲、床とラグ)。bubble はペットのひとこと */
export function PetRoom({ bubble, compact, children }: Props) {
  const [sky] = useState(() => skyAt(new Date().getHours()))
  const night = sky.key === 'night'
  return (
    <div
      className={`relative mb-3.5 overflow-hidden rounded-[22px] border-3 border-ink shadow-pop ${compact ? 'pt-2 pb-1' : 'pt-3.5 pb-1.5'}`}
      style={{
        background: `linear-gradient(${sky.top} 0, ${sky.low} 62%, ${sky.floor} 62%)`,
      }}
    >
      {/* 太陽 (夜は月: 空の色の丸を重ねて欠けさせる) */}
      <div className="absolute top-3 left-3.5 size-9 overflow-hidden rounded-full border-3 border-ink bg-sun">
        {night ? (
          <div
            className="absolute -top-1.5 -right-2.5 size-8 rounded-full"
            style={{ background: sky.top }}
          />
        ) : null}
      </div>
      {night
        ? STARS.map((pos) => (
            <i
              key={pos}
              className={`absolute size-1.5 animate-twinkle rounded-full bg-cream motion-reduce:animate-none ${pos}`}
            />
          ))
        : null}
      {cloud(`top-[32%] left-[5%] w-13 ${night ? 'opacity-30' : 'opacity-85'}`)}
      {cloud(
        `top-[38%] right-[5%] w-9 [animation-delay:-4s] ${night ? 'opacity-30' : 'opacity-85'}`,
      )}
      {/* 猫が座るラグ */}
      <div
        className={`absolute left-1/2 h-11 w-[66%] -translate-x-1/2 rounded-[50%] border-3 border-ink bg-pink ${compact ? '-bottom-4' : 'bottom-5'}`}
      />
      {bubble ? (
        <motion.div
          key={bubble}
          className="absolute top-3 right-3 z-1 origin-bottom-left rounded-[14px] border-3 border-ink bg-white px-2.5 py-1.5 text-[13px]"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        >
          {bubble}
        </motion.div>
      ) : null}
      <div className="relative">{children}</div>
    </div>
  )
}
