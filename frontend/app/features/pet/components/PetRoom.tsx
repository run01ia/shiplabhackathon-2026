import { motion } from 'motion/react'
import type { ReactNode } from 'react'

type Props = { bubble?: string; compact?: boolean; children: ReactNode }

const cloud = (className: string) => (
  <svg
    viewBox="0 0 60 26"
    className={`absolute animate-drift opacity-85 motion-reduce:animate-none ${className}`}
    aria-hidden="true"
  >
    <path d="M10 25a9 9 0 0 1 2-18a13 13 0 0 1 25-2a10 10 0 0 1 13 20z" fill="#fff" />
  </svg>
)

/** ペットの部屋 (空と雲、床とラグ)。bubble はペットのひとこと */
export function PetRoom({ bubble, compact, children }: Props) {
  return (
    <div
      className={`relative mb-3.5 overflow-hidden rounded-[22px] border-3 border-ink bg-[linear-gradient(#bfe6f2_0_62%,#e8c48b_62%)] shadow-pop ${compact ? 'pt-2 pb-1' : 'pt-3.5 pb-1.5'}`}
    >
      {cloud('top-[9%] left-[7%] w-14')}
      {cloud('top-[36%] right-[5%] w-9 [animation-delay:-4s]')}
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
