import { motion, useReducedMotion } from 'motion/react'
import { type RefObject, useEffect, useEffectEvent, useRef, useState } from 'react'

export type Reward = { reason: string; delta: number }
type Props = {
  rewards: readonly Reward[]
  /** コインが吸い込まれる先 (ホームのコイン表示) */
  targetRef: RefObject<HTMLElement | null>
  /** コインが 1 枚届くたびに、増えた枚数を知らせる */
  onCoin: (amount: number) => void
  onDone: () => void
}

type Flight = { x: number; y: number; coins: { ox: number; oy: number; amount: number }[] }
const SHOW_MS = 900
const GAP_MS = 250

/** delta を k 枚のコインに分ける (合計は必ず delta) */
const split = (delta: number, k: number) =>
  Array.from(
    { length: k },
    (_, i) => Math.round((delta * (i + 1)) / k) - Math.round((delta * i) / k),
  )

/**
 * 報酬の演出。カードが弾んで出る → フェードアウトしながら、コインがコイン表示へ吸い込まれる。
 * 動かすのは transform と opacity だけ。reduced-motion ではコインを飛ばさない。
 */
export function RewardFx({ rewards, targetRef, onCoin, onDone }: Props) {
  const [index, setIndex] = useState(0)
  const [flight, setFlight] = useState<Flight | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const arrived = useRef(0)
  const reduced = useReducedMotion()
  const reward = rewards[index]

  const next = useEffectEvent(() => {
    arrived.current = 0
    setFlight(null)
    if (index + 1 < rewards.length) setIndex(index + 1)
    else onDone()
  })

  const launch = useEffectEvent(() => {
    const card = cardRef.current?.getBoundingClientRect()
    const target = targetRef.current?.getBoundingClientRect()
    if (!reward) return
    if (reduced || !card || !target) {
      onCoin(reward.delta)
      setFlight({ x: 0, y: 0, coins: [] })
      return
    }
    const k = Math.min(8, Math.max(4, Math.floor(reward.delta / 4)))
    setFlight({
      x: target.left + target.width / 2 - (card.left + card.width / 2),
      y: target.top + target.height / 2 - (card.top + card.height / 2),
      coins: split(reward.delta, k).map((amount) => ({
        ox: (Math.random() - 0.5) * 90,
        oy: (Math.random() - 0.5) * 40,
        amount,
      })),
    })
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: index が進むたびに、次の報酬のタイマーを張り直す
  useEffect(() => {
    const t = setTimeout(launch, SHOW_MS)
    return () => clearTimeout(t)
  }, [index])

  // コインを飛ばさないとき (reduced-motion) は、フェードアウトを待って次へ
  useEffect(() => {
    if (!flight || flight.coins.length > 0) return
    const t = setTimeout(next, 700 + GAP_MS)
    return () => clearTimeout(t)
  }, [flight])

  const land = (amount: number) => {
    onCoin(amount)
    arrived.current += 1
    if (flight && arrived.current === flight.coins.length) setTimeout(next, GAP_MS)
  }

  if (!reward) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-live="polite">
      <div className="absolute inset-x-0 top-[34%] flex justify-center">
        <motion.div
          key={index}
          ref={cardRef}
          className="rounded-pill border-3 border-ink bg-paper px-5.5 py-3.5 text-center whitespace-nowrap shadow-pop"
          initial={{ scale: reduced ? 1 : 0.6, opacity: 1 }}
          animate={flight ? { scale: 1, opacity: 0 } : { scale: reduced ? 1 : [0.6, 1.15, 1] }}
          transition={{ duration: flight ? 0.7 : 0.45 }}
        >
          <small className="mb-0.5 block text-sm">{reward.reason}</small>
          <b className="text-[34px] text-[#1f8d62]">+{reward.delta}</b>
        </motion.div>
        {flight?.coins.map((c, i) => (
          <motion.i
            // biome-ignore lint/suspicious/noArrayIndexKey: 並びが変わらない使い捨ての粒
            key={`${index}-${i}`}
            className="absolute top-1/2 left-1/2 -mt-3 -ml-3 size-6 rounded-full border-3 border-ink bg-sun"
            initial={{ x: c.ox, y: c.oy, scale: 1, opacity: 1 }}
            animate={{ x: flight.x, y: flight.y, scale: [1, 0.5, 0.2], opacity: [1, 1, 0] }}
            transition={{
              duration: 0.8 + i * 0.07,
              delay: i * 0.06,
              ease: [0.5, 0, 0.8, 0.4],
              scale: { times: [0, 0.9, 1], duration: 0.8 + i * 0.07, delay: i * 0.06 },
              opacity: { times: [0, 0.9, 1], duration: 0.8 + i * 0.07, delay: i * 0.06 },
            }}
            onAnimationComplete={() => land(c.amount)}
          />
        ))}
      </div>
    </div>
  )
}
