import { motion, useReducedMotion } from 'motion/react'

const HEART = 'M0 7C-11-1-8-10 0-4C8-10 11-1 0 7z'
/** 同時に出すハートの数 (連打しても増えすぎない) */
const KEEP = 3

/** なでるたびに、頭の上にハートが 1 つ浮かんで消える。count はなでた回数 */
export function HeartPop({ count }: { count: number }) {
  const reduced = useReducedMotion()
  if (reduced) return null
  const ids = Array.from({ length: KEEP }, (_, i) => count - i).filter((id) => id > 0)
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[14%] flex justify-center">
      {ids.map((id) => {
        // 回数から左右の位置を決める (乱数を使わず、描き直しても動かない)
        const dx = ((id * 47) % 110) - 55
        return (
          <motion.svg
            key={id}
            viewBox="-12 -10 24 20"
            className="absolute size-8"
            aria-hidden="true"
            initial={{ x: dx, y: 0, scale: 0.3, opacity: 0, rotate: dx / 4 }}
            animate={{ y: -44, scale: [0.3, 1.25, 1], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            <path
              d={HEART}
              fill="#ff6fa0"
              stroke="#2b2118"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </motion.svg>
        )
      })}
    </div>
  )
}
