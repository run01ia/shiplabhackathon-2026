import { motion } from 'motion/react'
import type { ReactNode } from 'react'

type Props = { bubble?: string; compact?: boolean; children: ReactNode }

/** ペットの部屋 (空と床)。bubble はペットのひとこと */
export function PetRoom({ bubble, compact, children }: Props) {
  return (
    <div
      className={`relative mb-3.5 rounded-[22px] border-3 border-ink bg-[linear-gradient(#bfe6f2_0_62%,#e8c48b_62%)] shadow-pop ${compact ? 'pt-2 pb-1' : 'pt-3.5 pb-1.5'}`}
    >
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
      {children}
    </div>
  )
}
