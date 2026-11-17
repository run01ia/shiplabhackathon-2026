import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Pet } from '~/features/pet'
import { CATEGORY_VIEW, formatYen, summarize } from '../logic/category'
import type { ScanResult } from '../types'

const MOOD = {
  no_snack: 'joy',
  few_snack: 'happy',
  some_snack: 'happy',
  many_snack: 'sad',
} as const satisfies Record<ScanResult['verdict'], 'joy' | 'happy' | 'sad'>

// 紙吹雪は使うときにだけ読み込む。バッジの位置から出す
const celebrate = async (el: HTMLElement | null) => {
  const { default: fire } = await import('canvas-confetti')
  const r = el?.getBoundingClientRect()
  fire({
    particleCount: 60,
    spread: 70,
    startVelocity: 28,
    origin: r
      ? {
          x: (r.left + r.width / 2) / window.innerWidth,
          y: (r.top + r.height / 2) / window.innerHeight,
        }
      : { x: 0.5, y: 0.6 },
    colors: ['#3dbe8b', '#ffc93c', '#f2542d', '#ffffff'],
    disableForReducedMotion: true,
  })
}

/** 読み取り結果: ペットのひとこと、ボーナス、分類の帯グラフ、品目 */
export function ReceiptResult({ result }: { result: ScanResult }) {
  const reduced = useReducedMotion()
  const badgeRef = useRef<HTMLSpanElement>(null)
  const shares = summarize(result.items)
  const bonus = result.bonus

  useEffect(() => {
    if (bonus) void celebrate(badgeRef.current)
  }, [bonus])

  return (
    <div aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="shrink-0">
          <Pet mood={MOOD[result.verdict]} size={92} accessories={['cap']} />
        </div>
        <motion.p
          className="relative m-0 rounded-card border-3 border-ink bg-cream px-3 py-2 text-sm"
          initial={{ scale: reduced ? 1 : 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 0.15 }}
          style={{ transformOrigin: 'left center' }}
        >
          {result.comment}
        </motion.p>
      </div>

      {bonus ? (
        <div className="mt-2 flex items-center justify-between">
          <span>{bonus.label.replace('レシート: ', '')} ボーナス</span>
          <motion.span
            ref={badgeRef}
            className="rounded-pill border-3 border-ink bg-sun px-3 text-xl"
            initial={{ scale: reduced ? 1 : 0, rotate: reduced ? 0 : -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 11, delay: 0.4 }}
          >
            +{bonus.points}
          </motion.span>
        </div>
      ) : result.alreadyRewarded ? (
        <p className="mt-2 mb-0 text-xs font-normal text-muted">
          今日のレシートのボーナスは受け取り済みだよ
        </p>
      ) : null}

      {/* 分類の帯グラフ (金額の割合)。幅ではなく scaleX を伸ばす */}
      <div className="mt-3 flex h-5 overflow-hidden rounded-xl border-3 border-ink bg-white">
        {shares.map((s, i) => (
          <motion.i
            key={s.category}
            className={`block h-full ${CATEGORY_VIEW[s.category].bg}`}
            style={{ width: `${s.ratio * 100}%`, transformOrigin: 'left' }}
            initial={{ scaleX: reduced ? 1 : 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.12, ease: 'easeOut' }}
          />
        ))}
      </div>
      <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-xs font-normal">
        {shares.map((s) => (
          <li key={s.category} className="flex items-center gap-1">
            <i
              className={`inline-block size-3 rounded-full border-2 border-ink ${CATEGORY_VIEW[s.category].bg}`}
            />
            {CATEGORY_VIEW[s.category].label} {Math.round(s.ratio * 100)}%
          </li>
        ))}
      </ul>

      <ul className="m-0 mt-2 max-h-56 list-none overflow-y-auto p-0">
        {result.items.map((it, i) => (
          <motion.li
            // biome-ignore lint/suspicious/noArrayIndexKey: レシートは同じ品目が並ぶことがあり、並びも変わらない
            key={i}
            className="flex items-center gap-2 border-b-2 border-dashed border-gray py-1.5"
            initial={{ opacity: 0, x: reduced ? 0 : -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i, 12) * 0.05 }}
          >
            <i
              className={`inline-block size-3 shrink-0 rounded-full border-2 border-ink ${CATEGORY_VIEW[it.category].bg}`}
              role="img"
              aria-label={CATEGORY_VIEW[it.category].label}
            />
            <span className="min-w-0 flex-1 truncate font-normal">{it.name}</span>
            <b className={it.price < 0 ? 'text-mint' : ''}>{formatYen(it.price)}</b>
          </motion.li>
        ))}
      </ul>
      <div className="flex justify-between pt-1.5">
        <span>レシートの合計</span>
        <b>{formatYen(result.total)}</b>
      </div>
    </div>
  )
}
